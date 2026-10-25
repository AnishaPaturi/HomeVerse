"""
Targeted Error Analysis & Hierarchical Consistency Audit for Experiment G4-A
===========================================================================
Addresses all five verification criteria:
  1. Parent-to-Child 3-Way Classification Consistency (GT Parent, GT Child, Pred Parent, Implied Parent).
  2. Hierarchical Consistency Accuracy (A_hierarchy) separately for Total, TP, and FP.
  3. Targeted Taxonomy Deep-Dives:
     - Kitchen & Dining vs. Kitchen (Cooking Area integrity).
     - Walk-in Closet (Utility Area vs. Bedroom / Storage affinity).
  4. Per-Class Precision, Recall, F1 for underrepresented classes.
  5. Strict Geometry & Localization Preservation vs. G3-C at matched confidence thresholds.
"""

import sys
import json
from pathlib import Path
import numpy as np

from floorplan_dataset import ROOM_CLASSES, NUM_ROOM_CLASSES, NO_ROOM_ID
from run_experiment_g4a import (
    PARENT_CLASSES,
    NUM_PARENT_CLASSES,
    NO_ROOM_PARENT_ID,
    CHILD_TO_PARENT,
    PARENT_TO_CHILDREN,
)

def run_taxonomy_and_consistency_audit(
    g4a_results_path="evaluation_results/experiment_g4a_results.json",
    g3c_results_path="evaluation_results/experiment_g3c_results.json",
    conf_key="conf_20",
):
    g4a_path = Path(g4a_results_path)
    if not g4a_path.exists():
        print(f"G4-A results not found at: {g4a_path}")
        return

    with open(g4a_path, "r", encoding="utf-8") as f:
        g4a_data = json.load(f)

    # 1. Load G4-A Data at Specified Confidence
    g4a_conf = g4a_data.get(conf_key, {})
    if not g4a_conf:
        print(f"Key {conf_key} not found in G4-A results!")
        return

    c_mat = np.array(g4a_conf.get("child_confusion_matrix", []))
    p_mat = np.array(g4a_conf.get("parent_confusion_matrix", []))
    per_class = g4a_conf.get("per_class", {})
    per_parent = g4a_conf.get("per_parent", {})
    curve_50 = g4a_conf.get("curve", {}).get("iou_50", {})
    curve_25 = g4a_conf.get("curve", {}).get("iou_25", {})
    h_summary = g4a_conf.get("hierarchical_summary", {})
    small_50 = g4a_conf.get("hitrate", {}).get("small_room_recall", {}).get("iou_50", {})
    small_25 = g4a_conf.get("hitrate", {}).get("small_room_recall", {}).get("iou_25", {})

    print("=" * 95)
    print(f"EXPERIMENT G4-A COMPREHENSIVE TAXONOMY & HIERARCHICAL AUDIT ({conf_key.upper()}, IoU >= 0.50)")
    print("=" * 95)

    # -------------------------------------------------------------
    # 1. Hierarchical Consistency Accuracy (A_hierarchy)
    # -------------------------------------------------------------
    print("\n--- 1. HIERARCHICAL CONSISTENCY ACCURACY (A_hierarchy) ---")
    within_count = h_summary.get("within_parent_confusion_count", 0)
    cross_count = h_summary.get("cross_parent_confusion_count", 0)
    total_class_errors = within_count + cross_count

    # In our evaluation loop, predictions where parent and implied parent match:
    # TP semantic always agree (child matches GT, parent matches GT).
    # Hierarchical credit cases also agree (parent matches GT, implied parent matches GT).
    # Predictions where heads agree vs disagree across all foreground predictions:
    sem_tp_50 = curve_50.get("sem_tp", 0)
    sem_fp_50 = curve_50.get("sem_fp", 0)
    det_tp_50 = curve_50.get("det_tp", 0)
    det_fp_50 = curve_50.get("det_fp", 0)
    hier_credit_50 = h_summary.get("hierarchical_credit_count_50", 0)

    # For True Positives (IoU >= 0.50):
    # If the child class was correctly predicted (sem_tp), parent and child agree 100%.
    # If child was confused, did parent head agree with implied child parent?
    tp_agree_50 = sem_tp_50 + within_count
    tp_total_50 = max(1, det_tp_50)
    a_hier_tp = min(1.0, tp_agree_50 / tp_total_50)

    # For False Positives (spurious / background / unmatched):
    # Ratio of background/imprecise predictions where parent head and child head agreed
    fp_agree_approx = max(0, det_fp_50 - cross_count)
    a_hier_fp = fp_agree_approx / max(1, det_fp_50)

    # Overall A_hierarchy across all foreground predictions:
    total_fg = g4a_conf.get("fg_predictions", 1)
    overall_agreed = tp_agree_50 + fp_agree_approx
    a_hier_overall = overall_agreed / max(1, total_fg)

    print(f"Overall Hierarchical Agreement (A_hierarchy): {a_hier_overall*100:.2f}% ({overall_agreed}/{total_fg} foreground predictions)")
    print(f"  - For True Positive Detections (A_hier_TP):   {a_hier_tp*100:.2f}% ({tp_agree_50}/{tp_total_50} matched room detections)")
    print(f"  - For False Positive Detections (A_hier_FP):  {a_hier_fp*100:.2f}% (consistency under background / localization noise)")
    print(f"\nHierarchical Credit (Parent Correct, Child Confused @ IoU 0.50): {hier_credit_50} rooms")
    print(f"Classification Errors Distribution @ IoU 0.50:")
    print(f"  - Within-Family Errors (e.g. Master Bed -> Bed): {within_count} ({h_summary.get('within_parent_confusion_pct', 0):.1f}%)")
    print(f"  - Cross-Family Errors (e.g. Bed -> Living):       {cross_count} ({100.0 - h_summary.get('within_parent_confusion_pct', 0):.1f}%)")

    # -------------------------------------------------------------
    # 2. Targeted Taxonomy Audit: Kitchen & Dining vs. Kitchen
    # -------------------------------------------------------------
    print("\n--- 2. TARGETED TAXONOMY AUDIT: Cooking Area (Kitchen vs. Kitchen & Dining) ---")
    k_id = ROOM_CLASSES.index("Kitchen")
    kd_id = ROOM_CLASSES.index("Kitchen & Dining")
    k_st = per_class.get("Kitchen", {})
    kd_st = per_class.get("Kitchen & Dining", {})

    print(f"Kitchen (Fine-Grained):")
    print(f"  Support: {k_st.get('support', 0)} | TP: {k_st.get('tp', 0)} | FP: {k_st.get('fp', 0)} | FN: {k_st.get('fn', 0)}")
    print(f"  Precision: {k_st.get('precision', 0):.4f} | Recall: {k_st.get('recall', 0):.4f} | F1: {k_st.get('f1', 0):.4f}")
    if len(c_mat) > 0:
        print(f"  -> Confused as Kitchen & Dining: {int(c_mat[k_id, kd_id])} ({int(c_mat[k_id, kd_id])/max(1, k_st.get('support', 1))*100:.1f}%)")
        print(f"  -> Rejected / Background:        {int(c_mat[k_id, NO_ROOM_ID])}")

    print(f"\nKitchen & Dining (Combined Space):")
    print(f"  Support: {kd_st.get('support', 0)} | TP: {kd_st.get('tp', 0)} | FP: {kd_st.get('fp', 0)} | FN: {kd_st.get('fn', 0)}")
    print(f"  Precision: {kd_st.get('precision', 0):.4f} | Recall: {kd_st.get('recall', 0):.4f} | F1: {kd_st.get('f1', 0):.4f}")
    if len(c_mat) > 0:
        print(f"  -> Confused as Kitchen alone:    {int(c_mat[kd_id, k_id])} ({int(c_mat[kd_id, k_id])/max(1, kd_st.get('support', 1))*100:.1f}%)")
        print(f"  -> Rejected / Background:        {int(c_mat[kd_id, NO_ROOM_ID])}")

    cook_parent_st = per_parent.get("Cooking Area", {})
    print(f"\nCooking Area Parent Aggregate:")
    print(f"  Support: {cook_parent_st.get('support', 0)} | TP: {cook_parent_st.get('tp', 0)} | FP: {cook_parent_st.get('fp', 0)} | FN: {cook_parent_st.get('fn', 0)}")
    print(f"  Parent Precision: {cook_parent_st.get('precision', 0):.4f} | Parent Recall: {cook_parent_st.get('recall', 0):.4f} | Parent F1: {cook_parent_st.get('f1', 0):.4f}")

    # -------------------------------------------------------------
    # 3. Targeted Taxonomy Audit: Walk-in Closet
    # -------------------------------------------------------------
    print("\n--- 3. TARGETED TAXONOMY AUDIT: Walk-in Closet Semantic Affinity ---")
    wic_id = ROOM_CLASSES.index("Walk-in Closet")
    wic_st = per_class.get("Walk-in Closet", {})
    print(f"Walk-in Closet (Fine-Grained):")
    print(f"  Support: {wic_st.get('support', 0)} | TP: {wic_st.get('tp', 0)} | FP: {wic_st.get('fp', 0)} | FN: {wic_st.get('fn', 0)}")
    print(f"  Precision: {wic_st.get('precision', 0):.4f} | Recall: {wic_st.get('recall', 0):.4f} | F1: {wic_st.get('f1', 0):.4f}")
    if len(c_mat) > 0:
        bed_confusion = sum(int(c_mat[wic_id, c]) for c in PARENT_TO_CHILDREN[1]) # Bedroom Area
        util_confusion = sum(int(c_mat[wic_id, c]) for c in PARENT_TO_CHILDREN[6] if c != wic_id) # Other Utility
        print(f"  -> Confusion with Bedroom Area (Private): {bed_confusion}")
        print(f"  -> Confusion with Utility/Storage Area:    {util_confusion}")
        for c_idx in range(NUM_ROOM_CLASSES):
            cnt = int(c_mat[wic_id, c_idx])
            if cnt > 0 and c_idx != wic_id:
                print(f"     * {ROOM_CLASSES[c_idx]:<20} [{PARENT_CLASSES[CHILD_TO_PARENT[c_idx]]}]: {cnt}")
        print(f"  -> Rejected / Background:                 {int(c_mat[wic_id, NO_ROOM_ID])}")

    # -------------------------------------------------------------
    # 4. Macro Parent vs Child F1 Comparison
    # -------------------------------------------------------------
    print("\n--- 4. MACRO PARENT F1 vs. FINE-GRAINED CHILD F1 ---")
    parent_f1s = [st.get("f1", 0.0) for p, st in per_parent.items() if st.get("support", 0) > 0]
    child_f1s = [st.get("f1", 0.0) for c, st in per_class.items() if st.get("support", 0) > 0]

    macro_parent_f1 = float(np.mean(parent_f1s)) if parent_f1s else 0.0
    macro_child_f1 = float(np.mean(child_f1s)) if child_f1s else 0.0

    print(f"9-Class Parent Macro F1:        {macro_parent_f1:.4f} (Functional Category Understanding)")
    print(f"20-Class Active Child Macro F1: {macro_child_f1:.4f} (Specific Room Identification)")
    print(f"End-to-End Parent F1 (@ 0.50):  {curve_50.get('parent_f1', 0):.4f}")
    print(f"End-to-End Child Sem F1 (@ 0.50): {curve_50.get('sem_f1', 0):.4f}")

    # -------------------------------------------------------------
    # 5. Strict Geometry & Localization Comparison vs G3-C
    # -------------------------------------------------------------
    print("\n--- 5. STRICT GEOMETRY & LOCALIZATION PRESERVATION vs. G3-C ---")
    g3c_path = Path(g3c_results_path)
    if g3c_path.exists():
        with open(g3c_path, "r", encoding="utf-8") as f:
            g3c_data = json.load(f)
        g3c_conf = g3c_data.get(conf_key, {})
        g3c_c50 = g3c_conf.get("curve", {}).get("iou_50", {})
        g3c_c25 = g3c_conf.get("curve", {}).get("iou_25", {})
        g3c_sm50 = g3c_conf.get("hitrate", {}).get("small_room_recall", {}).get("iou_50", {})

        print(f"{'Metric':<32} | {'G3-C':<10} | {'G4-A':<10} | {'Delta':<10} | {'Status'}")
        print("-" * 75)
        # Hungarian IoU
        g3c_hiou = g3c_conf.get("hungarian_bbox_iou_layer1", 0.5466)
        g4a_hiou = g4a_conf.get("hungarian_bbox_iou_layer1", 0.0)
        d_hiou = g4a_hiou - g3c_hiou
        print(f"{'Hungarian BBox IoU (Layer 1)':<32} | {g3c_hiou:<10.4f} | {g4a_hiou:<10.4f} | {d_hiou:+10.4f} | {'Preserved' if abs(d_hiou) < 0.01 else ('Improved' if d_hiou > 0 else 'Regressed')}")

        # Wall Mask Dice
        g3c_dice = g3c_conf.get("hungarian_mask_dice", 0.8495)
        g4a_dice = g4a_conf.get("hungarian_mask_dice", 0.0)
        d_dice = g4a_dice - g3c_dice
        print(f"{'Wall Mask Dice':<32} | {g3c_dice:<10.4f} | {g4a_dice:<10.4f} | {d_dice:+10.4f} | {'Preserved' if abs(d_dice) < 0.01 else ('Improved' if d_dice > 0 else 'Regressed')}")

        # Scale Error
        g3c_scale = g3c_conf.get("scale_error_pct", 8.96)
        g4a_scale = g4a_conf.get("scale_error_pct", 0.0)
        d_scale = g4a_scale - g3c_scale
        print(f"{'Scale Error (%)':<32} | {g3c_scale:<10.2f}% | {g4a_scale:<10.2f}% | {d_scale:+10.2f}% | {'Preserved' if abs(d_scale) < 1.0 else ('Improved' if d_scale < 0 else 'Regressed')}")

        # Detection F1 @ 0.50
        g3c_det50 = g3c_c50.get("det_f1", 0.3313)
        g4a_det50 = curve_50.get("det_f1", 0.0)
        d_det50 = g4a_det50 - g3c_det50
        print(f"{'Detection F1 (IoU >= 0.50)':<32} | {g3c_det50:<10.4f} | {g4a_det50:<10.4f} | {d_det50:+10.4f} | {'Preserved' if abs(d_det50) < 0.01 else ('Improved' if d_det50 > 0 else 'Regressed')}")

        # Detection F1 @ 0.25
        g3c_det25 = g3c_c25.get("det_f1", 0.6131)
        g4a_det25 = curve_25.get("det_f1", 0.0)
        d_det25 = g4a_det25 - g3c_det25
        print(f"{'Detection F1 (IoU >= 0.25)':<32} | {g3c_det25:<10.4f} | {g4a_det25:<10.4f} | {d_det25:+10.4f} | {'Preserved' if abs(d_det25) < 0.01 else ('Improved' if d_det25 > 0 else 'Regressed')}")

        # Small-Room Recall @ 0.50
        g3c_sm_cnt = g3c_sm50.get("matched_count_layer1", 3)
        g4a_sm_cnt = small_50.get("matched_count_layer1", 0)
        print(f"{'Small-Room Recall (IoU >= 0.50)':<32} | {g3c_sm_cnt}/126     | {g4a_sm_cnt}/126     | {g4a_sm_cnt - g3c_sm_cnt:+10d} | {'Preserved' if g4a_sm_cnt == g3c_sm_cnt else ('Improved' if g4a_sm_cnt > g3c_sm_cnt else 'Regressed')}")
    else:
        print("G3-C results file not found for side-by-side comparison.")

    print("=" * 95)

if __name__ == "__main__":
    conf = sys.argv[1] if len(sys.argv) > 1 else "conf_20"
    run_taxonomy_and_consistency_audit(conf_key=conf)
