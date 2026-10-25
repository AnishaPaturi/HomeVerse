"""
Targeted Error Analysis for Experiment G4-A Taxonomy
===================================================
Analyzes the specific functional taxonomy questions raised:
  1. Kitchen & Dining vs. Kitchen alone (Cooking Area integrity)
  2. Walk-in Closet behavior (Utility Area vs. Bedroom / Storage)
  3. Parent Category vs Fine-Grained Class performance breakdown
  4. Hierarchical Credit & Within-Family Confusion Rate
"""

import sys
import json
from pathlib import Path
import numpy as np

from floorplan_dataset import ROOM_CLASSES, NUM_ROOM_CLASSES, NO_ROOM_ID
from run_experiment_g4a import PARENT_CLASSES, NUM_PARENT_CLASSES, NO_ROOM_PARENT_ID, CHILD_TO_PARENT, PARENT_TO_CHILDREN

def analyze_g4a_results(results_path="evaluation_results/experiment_g4a_results.json"):
    results_path = Path(results_path)
    if not results_path.exists():
        print(f"File not found: {results_path}")
        return

    with open(results_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    conf_20 = data.get("conf_20", {})
    if not conf_20:
        print("conf_20 not found in results!")
        return

    c_mat = np.array(conf_20.get("child_confusion_matrix", []))
    p_mat = np.array(conf_20.get("parent_confusion_matrix", []))
    per_class = conf_20.get("per_class", {})
    per_parent = conf_20.get("per_parent", {})
    hierarchical_summary = conf_20.get("hierarchical_summary", {})

    print("=" * 80)
    print("G4-A TARGETED TAXONOMY & CONFUSION AUDIT (Confidence = 0.20, IoU >= 0.50)")
    print("=" * 80)

    # 1. Cooking Area Audit: Kitchen vs Kitchen & Dining
    print("\n--- 1. COOKING AREA AUDIT: Kitchen vs Kitchen & Dining ---")
    k_id = ROOM_CLASSES.index("Kitchen")
    kd_id = ROOM_CLASSES.index("Kitchen & Dining")

    k_supp = per_class.get("Kitchen", {}).get("support", 0)
    k_tp = per_class.get("Kitchen", {}).get("tp", 0)
    k_pred_as_kd = int(c_mat[k_id, kd_id]) if len(c_mat) > 0 else 0
    k_pred_as_bg = int(c_mat[k_id, NO_ROOM_ID]) if len(c_mat) > 0 else 0

    kd_supp = per_class.get("Kitchen & Dining", {}).get("support", 0)
    kd_tp = per_class.get("Kitchen & Dining", {}).get("tp", 0)
    kd_pred_as_k = int(c_mat[kd_id, k_id]) if len(c_mat) > 0 else 0
    kd_pred_as_bg = int(c_mat[kd_id, NO_ROOM_ID]) if len(c_mat) > 0 else 0

    print(f"Ground Truth Kitchen (Support: {k_supp}):")
    print(f"  - Correctly predicted as Kitchen:            {k_tp}")
    print(f"  - Confused as Kitchen & Dining (Within-Parent): {k_pred_as_kd}")
    print(f"  - Unmatched / Rejected as Background:        {k_pred_as_bg}")

    print(f"\nGround Truth Kitchen & Dining (Support: {kd_supp}):")
    print(f"  - Correctly predicted as Kitchen & Dining:   {kd_tp}")
    print(f"  - Confused as Kitchen alone (Within-Parent): {kd_pred_as_k}")
    print(f"  - Unmatched / Rejected as Background:        {kd_pred_as_bg}")

    # 2. Walk-in Closet Audit: Utility Area vs Bedroom vs Storage
    print("\n--- 2. WALK-IN CLOSET AUDIT: Semantic Affinity ---")
    wic_id = ROOM_CLASSES.index("Walk-in Closet")
    wic_supp = per_class.get("Walk-in Closet", {}).get("support", 0)
    wic_tp = per_class.get("Walk-in Closet", {}).get("tp", 0)

    print(f"Ground Truth Walk-in Closet (Support: {wic_supp}):")
    print(f"  - Correctly predicted as Walk-in Closet:     {wic_tp}")
    if len(c_mat) > 0:
        for c_idx, c_name in enumerate(ROOM_CLASSES):
            count = int(c_mat[wic_id, c_idx])
            if count > 0 and c_idx != wic_id:
                p_name = PARENT_CLASSES[CHILD_TO_PARENT[c_idx]]
                print(f"  - Confused as {c_name:<20} [{p_name}]: {count}")
        print(f"  - Unmatched / Background:                    {int(c_mat[wic_id, NO_ROOM_ID])}")

    # 3. Parent Category Performance Table
    print("\n--- 3. FUNCTIONAL PARENT CATEGORY PERFORMANCE (Nominal Conf 0.20, IoU >= 0.50) ---")
    print(f"{'Parent Category':<22} | {'Support':<8} | {'TP':<6} | {'FP':<6} | {'FN':<6} | {'Precision':<9} | {'Recall':<8} | {'F1':<8}")
    print("-" * 85)
    for p_name in PARENT_CLASSES:
        st = per_parent.get(p_name, {})
        print(f"{p_name:<22} | {st.get('support', 0):<8} | {st.get('tp', 0):<6} | {st.get('fp', 0):<6} | {st.get('fn', 0):<6} | {st.get('precision', 0):<9.4f} | {st.get('recall', 0):<8.4f} | {st.get('f1', 0):<8.4f}")

    # 4. Hierarchical Credit Summary
    print("\n--- 4. HIERARCHICAL CREDIT & ERROR DISTRIBUTION ---")
    print(f"Hierarchical Credit Cases @ IoU 0.50 (Parent Correct, Child Confused): {hierarchical_summary.get('hierarchical_credit_count_50', 0)}")
    print(f"Hierarchical Credit Cases @ IoU 0.25 (Parent Correct, Child Confused): {hierarchical_summary.get('hierarchical_credit_count_25', 0)}")
    print(f"Within-Parent Misclassifications: {hierarchical_summary.get('within_parent_confusion_count', 0)} ({hierarchical_summary.get('within_parent_confusion_pct', 0)}% of classification errors)")
    print(f"Cross-Parent Misclassifications:  {hierarchical_summary.get('cross_parent_confusion_count', 0)}")
    print("=" * 80)

if __name__ == "__main__":
    analyze_g4a_results()
