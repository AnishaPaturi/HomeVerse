import json
from pathlib import Path

f2a_path = Path("evaluation_results/experiment_f2a_results.json")
with open(f2a_path, "r", encoding="utf-8") as f:
    data = json.load(f)

test = data["test"]

print("=" * 80)
print("EXPERIMENT G2: F2-A PER-CLASS & PER-SIZE FAILURE ANALYSIS")
print("=" * 80)

print("\n--- 1. ROOM SIZE BREAKDOWN (<6m², 6-18m², >18m², Irregular) ---")
print(f"{'Category':<22} | {'Support':<8} | {'TP':<5} | {'FP':<5} | {'FN':<5} | {'Prec':<7} | {'Recall':<7} | {'F1':<7} | {'BBox IoU':<9} | {'Dim MAE'}")
print("-" * 95)
for sname, s in test.get("per_size", {}).items():
    print(f"{sname:<22} | {s['support']:<8} | {s['tp']:<5} | {s['fp']:<5} | {s['fn']:<5} | {s['precision']:<7.4f} | {s['recall']:<7.4f} | {s['f1']:<7.4f} | {s['bbox_iou']:<9.4f} | {s.get('dim_mae_meters', 0.0):.3f} m")

print("\n--- 2. GRANULAR ROOM CLASS BREAKDOWN (Sorted by Support) ---")
print(f"{'Room Class':<22} | {'Support':<8} | {'TP':<5} | {'FP':<5} | {'FN':<5} | {'Prec':<7} | {'Recall':<7} | {'F1':<7} | {'BBox IoU'}")
print("-" * 85)
per_class = test.get("per_class", {})
sorted_classes = sorted(per_class.items(), key=lambda x: x[1]["support"], reverse=True)

zero_f1_classes = []
low_f1_classes = []
moderate_classes = []

for cname, c in sorted_classes:
    f1 = c['f1']
    if f1 == 0.0:
        zero_f1_classes.append((cname, c['support']))
    elif f1 < 0.10:
        low_f1_classes.append((cname, f1, c['support']))
    else:
        moderate_classes.append((cname, f1, c['support']))
    print(f"{cname:<22} | {c['support']:<8} | {c['tp']:<5} | {c['fp']:<5} | {c['fn']:<5} | {c['precision']:<7.4f} | {c['recall']:<7.4f} | {c['f1']:<7.4f} | {c['bbox_iou']:<7.4f}")

print("\n--- 3. ROOM CATEGORIZATION BY PERFORMANCE ---")
print(f"\n[ZERO RECOGNITION (F1 = 0.0000)] -> {len(zero_f1_classes)} classes:")
for cname, supp in zero_f1_classes:
    print(f"  - {cname:<22} (Support: {supp:3d} instances in test)")

print(f"\n[VERY LOW RECOGNITION (0 < F1 < 0.10)] -> {len(low_f1_classes)} classes:")
for cname, f1, supp in low_f1_classes:
    print(f"  - {cname:<22} (F1: {f1:.4f}, Support: {supp:3d} instances)")

print(f"\n[BEST PERFORMING (F1 >= 0.10)] -> {len(moderate_classes)} classes:")
for cname, f1, supp in moderate_classes:
    print(f"  - {cname:<22} (F1: {f1:.4f}, Support: {supp:3d} instances)")

print("\n--- 4. FUNCTIONAL FAMILY BREAKDOWN ---")
print(f"{'Functional Family':<25} | {'Support':<8} | {'TP':<5} | {'FP':<5} | {'FN':<5} | {'Prec':<7} | {'Recall':<7} | {'F1':<7} | {'BBox IoU'}")
print("-" * 90)
for fname, f_stat in test.get("per_family", {}).items():
    print(f"{fname:<25} | {f_stat['support']:<8} | {f_stat['tp']:<5} | {f_stat['fp']:<5} | {f_stat['fn']:<5} | {f_stat['precision']:<7.4f} | {f_stat['recall']:<7.4f} | {f_stat['f1']:<7.4f} | {f_stat['bbox_iou']:<7.4f}")
