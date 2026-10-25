import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch
import torch.nn as nn
import torch.nn.functional as F
from floorplan_dataset import ROOM_CLASSES, NUM_ROOM_CLASSES, NO_ROOM_ID
from scratch.test_g4a_sanity import MultiTaskViT384G4A, PARENT_CLASSES, NUM_PARENT_CLASSES, NO_ROOM_PARENT_ID, CHILD_TO_PARENT
from vit_detector import HungarianMatcher, box_cxcywh_to_xyxy, generalized_box_iou
from run_experiment_f1_fpn import compute_mask_loss

class MultiTaskCriterionG4A(nn.Module):
    def __init__(self, matcher, num_classes=NUM_ROOM_CLASSES, num_parent_classes=NUM_PARENT_CLASSES,
                 weight_class=1.0, weight_parent=0.5, weight_consist=0.5,
                 weight_bbox=5.0, weight_giou=2.0, weight_mask=2.5, weight_scale=0.1,
                 eos_coef=0.1, aux_loss_coef=0.5):
        super().__init__()
        self.matcher = matcher
        self.num_classes = num_classes
        self.num_parent_classes = num_parent_classes
        self.weight_class = weight_class
        self.weight_parent = weight_parent
        self.weight_consist = weight_consist
        self.weight_bbox = weight_bbox
        self.weight_giou = weight_giou
        self.weight_mask = weight_mask
        self.weight_scale = weight_scale
        self.aux_loss_coef = aux_loss_coef

        # Child class empty weight (EOS = 0.1 for background class 22)
        child_empty_weight = torch.ones(num_classes + 1)
        child_empty_weight[num_classes] = eos_coef
        self.register_buffer("child_empty_weight", child_empty_weight)

        # Parent class empty weight (EOS = 0.1 for background parent 9)
        parent_empty_weight = torch.ones(num_parent_classes + 1)
        parent_empty_weight[num_parent_classes] = eos_coef
        self.register_buffer("parent_empty_weight", parent_empty_weight)

        # Mapping tensor: child_id -> parent_id
        child_to_parent_tensor = torch.zeros(num_classes + 1, dtype=torch.int64)
        for c, p in CHILD_TO_PARENT.items():
            child_to_parent_tensor[c] = p
        self.register_buffer("child_to_parent_tensor", child_to_parent_tensor)

        # Aggregation matrix: [10, 23]
        child_to_parent_matrix = torch.zeros(num_parent_classes + 1, num_classes + 1)
        for c, p in CHILD_TO_PARENT.items():
            child_to_parent_matrix[p, c] = 1.0
        self.register_buffer("child_to_parent_matrix", child_to_parent_matrix)

    def forward(self, outputs, targets):
        pred_logits = outputs["pred_logits"]                 # [B, 40, 23]
        pred_parent_logits = outputs["pred_parent_logits"]   # [B, 40, 10]
        pred_boxes_1 = outputs["pred_boxes_1"]               # [B, 40, 4]
        pred_boxes_0 = outputs["pred_boxes_0"]               # [B, 40, 4]
        pred_masks = outputs["pred_masks"]                   # [B, 40, 96, 96]
        pred_log_scale = outputs["pred_log_scale"]           # [B]

        indices = self.matcher(pred_logits, pred_boxes_1, targets)
        bs, num_queries = pred_logits.shape[:2]

        # 1. Child Classification Loss
        target_classes = torch.full((bs, num_queries), self.num_classes, dtype=torch.int64, device=pred_logits.device)
        target_parents = torch.full((bs, num_queries), self.num_parent_classes, dtype=torch.int64, device=pred_logits.device)

        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                c_lbls = targets[b]["labels"][tgt_idx].to(pred_logits.device)
                target_classes[b, src_idx] = c_lbls
                target_parents[b, src_idx] = self.child_to_parent_tensor[c_lbls]

        loss_child_ce = F.cross_entropy(
            pred_logits.flatten(0, 1), target_classes.flatten(),
            weight=self.child_empty_weight.to(pred_logits.device)
        )

        # 2. Parent Functional Classification Loss
        loss_parent_ce = F.cross_entropy(
            pred_parent_logits.flatten(0, 1), target_parents.flatten(),
            weight=self.parent_empty_weight.to(pred_logits.device)
        )

        # 3. Hierarchical Consistency Loss (Bidirectional KL divergence)
        p_child = F.softmax(pred_logits, dim=-1)             # [B, 40, 23]
        p_parent = F.softmax(pred_parent_logits, dim=-1)     # [B, 40, 10]
        p_implied = torch.matmul(p_child, self.child_to_parent_matrix.t().to(pred_logits.device)) # [B, 40, 10]

        kl_1 = F.kl_div((p_parent + 1e-7).log(), p_implied, reduction="batchmean")
        kl_2 = F.kl_div((p_implied + 1e-7).log(), p_parent, reduction="batchmean")
        loss_consist = 0.5 * (kl_1 + kl_2)

        # 4. BBox Losses (Layer 1 + Auxiliary Layer 0)
        total_boxes = sum(len(t["labels"]) for t in targets)
        num_boxes = max(total_boxes, 1)

        src_boxes_1_list, src_boxes_0_list, target_boxes_list = [], [], []
        src_masks_list, target_masks_list = [], []

        for b, (src_idx, tgt_idx) in enumerate(indices):
            if len(src_idx) > 0:
                src_boxes_1_list.append(pred_boxes_1[b, src_idx])
                src_boxes_0_list.append(pred_boxes_0[b, src_idx])
                target_boxes_list.append(targets[b]["boxes"][tgt_idx].to(pred_logits.device))
                if "masks" in targets[b] and targets[b]["masks"] is not None:
                    src_masks_list.append(pred_masks[b, src_idx])
                    target_masks_list.append(targets[b]["masks"][tgt_idx].to(pred_logits.device))

        if src_boxes_1_list:
            src_boxes_1 = torch.cat(src_boxes_1_list, dim=0)
            src_boxes_0 = torch.cat(src_boxes_0_list, dim=0)
            target_boxes = torch.cat(target_boxes_list, dim=0)

            loss_bbox_1 = F.l1_loss(src_boxes_1, target_boxes, reduction="sum") / num_boxes
            loss_giou_1 = (1.0 - torch.diag(generalized_box_iou(
                box_cxcywh_to_xyxy(src_boxes_1), box_cxcywh_to_xyxy(target_boxes)
            ))).sum() / num_boxes

            loss_bbox_0 = F.l1_loss(src_boxes_0, target_boxes, reduction="sum") / num_boxes
            loss_giou_0 = (1.0 - torch.diag(generalized_box_iou(
                box_cxcywh_to_xyxy(src_boxes_0), box_cxcywh_to_xyxy(target_boxes)
            ))).sum() / num_boxes
        else:
            loss_bbox_1 = torch.tensor(0.0, device=pred_logits.device)
            loss_giou_1 = torch.tensor(0.0, device=pred_logits.device)
            loss_bbox_0 = torch.tensor(0.0, device=pred_logits.device)
            loss_giou_0 = torch.tensor(0.0, device=pred_logits.device)

        # 5. Mask Loss
        if src_masks_list and target_masks_list:
            all_src_masks = torch.cat(src_masks_list, dim=0)
            all_target_masks = torch.cat(target_masks_list, dim=0)
            if all_src_masks.shape[-2:] != all_target_masks.shape[-2:]:
                all_target_masks = F.interpolate(all_target_masks.unsqueeze(1), size=all_src_masks.shape[-2:], mode="nearest").squeeze(1)
            loss_mask, _, _ = compute_mask_loss(all_src_masks, all_target_masks)
        else:
            loss_mask = torch.tensor(0.0, device=pred_logits.device)

        # 6. Scale Loss
        gt_scales = torch.stack([t["scale_px_per_m"] for t in targets]).to(pred_logits.device).view_as(pred_log_scale)
        has_scale = torch.stack([t["has_scale"] for t in targets]).to(pred_logits.device).view_as(pred_log_scale)
        gt_log_scale = torch.log(gt_scales.clamp(min=1.0))
        raw_scale_loss = F.smooth_l1_loss(pred_log_scale, gt_log_scale, reduction="none")
        scale_denom = max(1.0, has_scale.sum().item())
        loss_scale = (raw_scale_loss * has_scale).sum() / scale_denom

        main_bbox_loss = self.weight_bbox * loss_bbox_1 + self.weight_giou * loss_giou_1
        aux_bbox_loss = self.aux_loss_coef * (self.weight_bbox * loss_bbox_0 + self.weight_giou * loss_giou_0)

        total_loss = (self.weight_class * loss_child_ce +
                      self.weight_parent * loss_parent_ce +
                      self.weight_consist * loss_consist +
                      main_bbox_loss +
                      aux_bbox_loss +
                      self.weight_mask * loss_mask +
                      self.weight_scale * loss_scale)

        return {
            "loss": total_loss,
            "loss_child_ce": loss_child_ce,
            "loss_parent_ce": loss_parent_ce,
            "loss_consist": loss_consist,
            "loss_bbox_1": loss_bbox_1,
            "loss_giou_1": loss_giou_1,
            "loss_bbox_0": loss_bbox_0,
            "loss_giou_0": loss_giou_0,
            "loss_mask": loss_mask,
            "loss_scale": loss_scale,
        }

if __name__ == "__main__":
    matcher = HungarianMatcher(cost_class=1.0, cost_bbox=5.0, cost_giou=2.0)
    crit = MultiTaskCriterionG4A(matcher=matcher)

    bs = 2
    pred_logits = torch.randn(bs, 40, 23, requires_grad=True)
    pred_parent_logits = torch.randn(bs, 40, 10, requires_grad=True)
    pred_boxes_1 = torch.rand(bs, 40, 4, requires_grad=True)
    pred_boxes_0 = torch.rand(bs, 40, 4, requires_grad=True)
    pred_masks = torch.randn(bs, 40, 96, 96, requires_grad=True)
    pred_log_scale = torch.tensor([4.0, 4.2], requires_grad=True)

    outputs = {
        "pred_logits": pred_logits,
        "pred_parent_logits": pred_parent_logits,
        "pred_boxes_1": pred_boxes_1,
        "pred_boxes_0": pred_boxes_0,
        "pred_masks": pred_masks,
        "pred_log_scale": pred_log_scale,
    }

    targets = [
        {
            "boxes": torch.tensor([[0.5, 0.5, 0.2, 0.2], [0.3, 0.3, 0.1, 0.1]]),
            "labels": torch.tensor([4, 8]), # Master Bedroom, Bathroom
            "masks": torch.zeros(2, 96, 96),
            "scale_px_per_m": torch.tensor(55.0),
            "has_scale": torch.tensor(1.0),
        },
        {
            "boxes": torch.tensor([[0.6, 0.6, 0.3, 0.3]]),
            "labels": torch.tensor([0]), # Living Room
            "masks": torch.zeros(1, 96, 96),
            "scale_px_per_m": torch.tensor(60.0),
            "has_scale": torch.tensor(1.0),
        }
    ]

    losses = crit(outputs, targets)
    print("Loss calculation successful:")
    for k, v in losses.items():
        print(f"  {k}: {v.item():.4f}")

    losses["loss"].backward()
    print("\nBackward pass successful! Gradients:")
    print("  pred_logits.grad is not None:", pred_logits.grad is not None)
    print("  pred_parent_logits.grad is not None:", pred_parent_logits.grad is not None)
    print("  pred_boxes_1.grad is not None:", pred_boxes_1.grad is not None)
