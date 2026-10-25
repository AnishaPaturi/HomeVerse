import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
import torch.nn as nn
import torch.nn.functional as F
from floorplan_dataset import ROOM_CLASSES, NUM_ROOM_CLASSES, NO_ROOM_ID
from run_experiment_g3c import MultiTaskViT384FPNRefine

PARENT_CLASSES = [
    "Living Area",        # 0
    "Bedroom Area",       # 1
    "Cooking Area",       # 2
    "Wet Area",           # 3
    "Study / Work Area",  # 4
    "Circulation",        # 5
    "Utility Area",       # 6
    "Outdoor Area",       # 7
    "Garage / Parking",   # 8
]
NUM_PARENT_CLASSES = len(PARENT_CLASSES)  # 9
NO_ROOM_PARENT_ID = NUM_PARENT_CLASSES    # 9 = Background

CHILD_TO_PARENT = {
    0: 0, 1: 2, 2: 0, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1,
    8: 3, 9: 3, 10: 4, 11: 4, 12: 6, 13: 6, 14: 7, 15: 7,
    16: 5, 17: 5, 18: 6, 19: 6, 20: 8, 21: 5, 22: 9,
}

PARENT_TO_CHILDREN = {p: [] for p in range(NUM_PARENT_CLASSES + 1)}
for c, p in CHILD_TO_PARENT.items():
    PARENT_TO_CHILDREN[p].append(c)


class MultiTaskViT384G4A(MultiTaskViT384FPNRefine):
    def __init__(self, img_size=384, num_queries_global=20, num_queries_highres=20,
                 num_classes=NUM_ROOM_CLASSES, num_parent_classes=NUM_PARENT_CLASSES,
                 decoder_layers=2):
        super().__init__(img_size=img_size, num_queries_global=num_queries_global,
                         num_queries_highres=num_queries_highres, num_classes=num_classes,
                         decoder_layers=decoder_layers)
        self.num_parent_classes = num_parent_classes
        hidden_dim = self.encoder.config.hidden_size  # 768
        self.parent_head = nn.Linear(hidden_dim, num_parent_classes + 1)

    def forward_with_features(self, cls_token, f6, f9, f12):
        out = super().forward_with_features(cls_token, f6, f9, f12)
        hs_1 = out["hs_1"]
        pred_parent_logits = self.parent_head(hs_1)  # [B, 40, 10]
        out["pred_parent_logits"] = pred_parent_logits
        return out


def load_g4a_from_g3c(model, g3c_ckpt_path, device="cpu"):
    g3c_weights = torch.load(g3c_ckpt_path, map_location=device)
    model_state = model.state_dict()
    matched_keys = []

    for k, v in g3c_weights.items():
        if k in model_state and model_state[k].shape == v.shape:
            model_state[k].copy_(v)
            matched_keys.append(k)

    # Initialize parent_head from class_head by averaging child weights
    class_w = g3c_weights["class_head.weight"]  # [23, 768]
    class_b = g3c_weights["class_head.bias"]    # [23]

    for p in range(NUM_PARENT_CLASSES):
        children = PARENT_TO_CHILDREN[p]
        p_w = torch.stack([class_w[c] for c in children]).mean(dim=0)
        p_b = torch.stack([class_b[c] for c in children]).mean(dim=0)
        model_state["parent_head.weight"][p].copy_(p_w)
        model_state["parent_head.bias"][p].copy_(p_b)

    # Background
    model_state["parent_head.weight"][NO_ROOM_PARENT_ID].copy_(class_w[22])
    model_state["parent_head.bias"][NO_ROOM_PARENT_ID].copy_(class_b[22])
    matched_keys.extend(["parent_head.weight", "parent_head.bias"])

    model.load_state_dict(model_state)
    uninitialized = [k for k in model_state if k not in matched_keys]
    return len(matched_keys), uninitialized


if __name__ == "__main__":
    print("Testing G4-A initialization from G3-C checkpoint...")
    ckpt_path = Path("checkpoints/multitask/experiment_g3c_best.pt")
    if not ckpt_path.exists():
        print(f"Error: {ckpt_path} not found!")
        sys.exit(1)

    model = MultiTaskViT384G4A()
    matched, uninit = load_g4a_from_g3c(model, ckpt_path)
    print(f"Successfully loaded {matched} weight tensors from G3-C.")
    print(f"Uninitialized keys: {uninit}")
    assert len(uninit) == 0, f"Uninitialized parameters found: {uninit}"

    # Test dummy forward pass
    bs = 2
    dummy_cls = torch.randn(bs, 768)
    dummy_f6 = torch.randn(bs, 576, 768)
    dummy_f9 = torch.randn(bs, 576, 768)
    dummy_f12 = torch.randn(bs, 576, 768)

    out = model.forward_with_features(dummy_cls, dummy_f6, dummy_f9, dummy_f12)
    print("Forward pass successful:")
    print("  pred_logits:", out["pred_logits"].shape)
    print("  pred_parent_logits:", out["pred_parent_logits"].shape)
    print("  pred_boxes:", out["pred_boxes"].shape)
    print("  pred_masks:", out["pred_masks"].shape)
    print("  pred_scale:", out["pred_scale"].shape)

    assert out["pred_logits"].shape == (bs, 40, 23)
    assert out["pred_parent_logits"].shape == (bs, 40, 10)
    assert out["pred_boxes"].shape == (bs, 40, 4)
    print("\nAll initial tests passed successfully!")
