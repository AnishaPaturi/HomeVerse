import torch
import torch.nn.functional as F
from vit_detector import HungarianMatcher, box_cxcywh_to_xyxy, generalized_box_iou
from multitask_vit import MultiTaskCriterion
from floorplan_dataset import NUM_ROOM_CLASSES

def test_matcher_and_loss():
    print("=" * 70)
    print("STEP 3: HUNGARIAN MATCHER & CRITERION DETAILED AUDIT")
    print("=" * 70)

    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    criterion = MultiTaskCriterion(matcher=matcher, num_classes=NUM_ROOM_CLASSES)

    # 2 sample batch, 5 queries, 2 ground truth rooms per image
    num_queries = 25
    bs = 2

    # Target rooms
    # Room 1: class 4 (Master Bedroom), box [0.2, 0.3, 0.4, 0.5]
    # Room 2: class 8 (Bathroom), box [0.7, 0.7, 0.2, 0.2]
    targets = [
        {
            "labels": torch.tensor([4, 8], dtype=torch.long),
            "boxes": torch.tensor([[0.2, 0.3, 0.4, 0.5], [0.7, 0.7, 0.2, 0.2]], dtype=torch.float32),
            "masks": torch.ones(2, 56, 56, dtype=torch.float32),
            "scale_px_per_m": torch.tensor(100.0, dtype=torch.float32),
            "has_scale": torch.tensor(1.0, dtype=torch.float32),
        },
        {
            "labels": torch.tensor([0, 5], dtype=torch.long),
            "boxes": torch.tensor([[0.5, 0.5, 0.3, 0.3], [0.1, 0.8, 0.15, 0.15]], dtype=torch.float32),
            "masks": torch.ones(2, 56, 56, dtype=torch.float32),
            "scale_px_per_m": torch.tensor(95.0, dtype=torch.float32),
            "has_scale": torch.tensor(1.0, dtype=torch.float32),
        }
    ]

    # Test Case A: PERFECT PREDICTION (query 0 is Room 1, query 1 is Room 2, rest are background)
    pred_logits = torch.full((bs, num_queries, NUM_ROOM_CLASSES + 1), -10.0)
    pred_logits[:, :, 22] = 10.0  # default background
    pred_boxes = torch.full((bs, num_queries, 4), 0.5)
    pred_masks = torch.full((bs, num_queries, 56, 56), -10.0)
    pred_scale = torch.tensor([100.0, 95.0])

    # Batch 0 perfect matches
    pred_logits[0, 0, 4] = 15.0   # Query 0 strongly predicts class 4
    pred_boxes[0, 0] = targets[0]["boxes"][0]
    pred_masks[0, 0] = 10.0
    pred_logits[0, 1, 8] = 15.0   # Query 1 strongly predicts class 8
    pred_boxes[0, 1] = targets[0]["boxes"][1]
    pred_masks[0, 1] = 10.0

    # Batch 1 perfect matches
    pred_logits[1, 2, 0] = 15.0   # Query 2 strongly predicts class 0
    pred_boxes[1, 2] = targets[1]["boxes"][0]
    pred_masks[1, 2] = 10.0
    pred_logits[1, 3, 5] = 15.0   # Query 3 strongly predicts class 5
    pred_boxes[1, 3] = targets[1]["boxes"][1]
    pred_masks[1, 3] = 10.0

    outputs = {
        "pred_logits": pred_logits,
        "pred_boxes": pred_boxes,
        "pred_masks": pred_masks,
        "pred_scale": pred_scale,
    }

    indices = matcher(pred_logits, pred_boxes, targets)
    print(f"\nMatcher output on perfect predictions:")
    print(f"  Batch 0 matched src queries: {indices[0][0].tolist()} -> tgt rooms: {indices[0][1].tolist()}")
    print(f"  Batch 1 matched src queries: {indices[1][0].tolist()} -> tgt rooms: {indices[1][1].tolist()}")

    assert indices[0][0].tolist() == [0, 1], f"Expected queries [0, 1] matched in batch 0, got {indices[0][0].tolist()}"
    assert indices[1][0].tolist() == [2, 3], f"Expected queries [2, 3] matched in batch 1, got {indices[1][0].tolist()}"
    print("Matcher perfectly identifies optimal query-to-ground-truth assignment.")

    loss_dict = criterion(outputs, targets)
    print(f"\nCriterion losses on perfect predictions:")
    for k, v in loss_dict.items():
        print(f"  {k}: {v.item():.6f}")

    assert loss_dict["loss_ce"].item() < 0.1, f"Expected low CE loss, got {loss_dict['loss_ce'].item()}"
    assert loss_dict["loss_bbox"].item() < 1e-4, f"Expected near-zero bbox loss, got {loss_dict['loss_bbox'].item()}"
    assert loss_dict["loss_giou"].item() < 1e-4, f"Expected near-zero giou loss, got {loss_dict['loss_giou'].item()}"
    assert loss_dict["loss_scale"].item() < 1e-4, f"Expected near-zero scale loss, got {loss_dict['loss_scale'].item()}"
    print("Loss criterion correctly approaches zero for perfect predictions.")

if __name__ == "__main__":
    test_matcher_and_loss()
