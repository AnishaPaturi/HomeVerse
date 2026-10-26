# Model Checkpoint Registry & Benchmark Status

This document tracks the official model progression and validation checkpoints for the HomeVerse spatial architecture multi-task Vision Transformer (ViT-B/16 + FPN).

---

## 🏆 Current Model Status

- **Current Best Experimental Candidate**: [`checkpoints/multitask/experiment_g4a_best.pt`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/checkpoints/multitask/experiment_g4a_best.pt) (482.8 MB)
  - Architecture: Two-scale queries (20 Global + 20 High-Res P8) + Iterative BBox Refinement + Hierarchical Functional Supervision (9 Parent categories + Consistency Loss).
  - Status: **Promoted as Active Best Checkpoint (Frozen)** following successful G4-A validation.
- **Preserved Geometric Standard**: [`checkpoints/multitask/experiment_g3c_best.pt`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/checkpoints/multitask/experiment_g3c_best.pt) (482.8 MB)
  - Architecture: Two-scale queries + Iterative BBox Refinement (Inverse-Sigmoid deltas).
  - Status: **Preserved Baseline** on disk for geometric comparison and regression testing.
- **Preserved Predecessor**: [`checkpoints/multitask/experiment_g3b_best.pt`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/checkpoints/multitask/experiment_g3b_best.pt) (481.7 MB)
  - Architecture: Two-scale queries (20 Global + 20 High-Res P8).
  - Status: **Preserved on Disk**.

---

## 📊 Comprehensive Metric Progression: G3-C vs. G4-A

Evaluated on the authoritative 75-layout unseen test benchmark (2,202 ground-truth rooms, 126 small rooms $< 6\,\text{m}^2$):

| Metric | G3-C Result (Nominal 0.20) | G4-A Result (Nominal 0.20) | G4-A Result (Peak 0.05) | Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Hungarian BBox IoU (Layer 1)** | 0.5466 | **0.5524** | **0.5524** | **Improved (+0.0058)** (All-time high) |
| **Wall Mask Dice** | 0.8495 | **0.8587** | **0.8587** | **Improved (+0.0092)** |
| **Scale Error (%)** | 8.96% | **8.93%** | **8.93%** | **Preserved** |
| **Detection F1, IoU $\ge$ 0.50** | 0.3313 | **0.3686** | **0.3883** | **Improved (+3.73% to +5.70%)** |
| **Detection F1, IoU $\ge$ 0.25** | 0.6131 | **0.6465** | **0.6414** | **Improved (+3.34%)** |
| **Small-Room Recall, IoU $\ge$ 0.50** | 2.38% (3/126) | **3.17% (4/126)** | **3.17% (4/126)** | **Preserved / Improved** |
| **Small-Room Recall, IoU $\ge$ 0.25** | 36.51% (46/126) | **40.48% (51/126)**| **50.00% (63/126)** | **Improved (+3.97%)** |
| **Child Semantic F1, IoU $\ge$ 0.50** | 0.0768 | **0.0853** | **0.0869** | **Improved (+0.85%)** |
| **Parent Functional F1, IoU $\ge$ 0.50**| N/A | **0.2042** | **0.2229** | **Established** |

---

## 🔬 Core G4-A Audit Findings

1. **Zero Geometric Regression**: Hierarchical functional supervision did not harm coordinate regression or wall segmentation. Hungarian BBox IoU rose to **0.5524**, Wall Mask Dice increased to **0.8587**, and Detection F1 at $\text{IoU} \ge 0.50$ advanced to **0.3686** (nominal) and **0.3883** (peak).
2. **Dual Semantic Gains**: The 9-class parent head did not cannibalize granular 22-class classification. Fine-grained semantic F1 at $\text{IoU} \ge 0.50$ rose from $0.0768 \rightarrow 0.0853$ (nominal) and $0.0841 \rightarrow 0.0869$ (peak).
3. **Hierarchical Consistency Accuracy ($A_{\text{hierarchy}}$)**:
   - **Overall Foreground Predictions**: **62.20%** agreement ($1,634 / 2,627$).
   - **True Positive Detections ($A_{\text{hierarchy}}^{\text{TP}}$)**: **47.53%** ($423 / 890$).
   - **Hierarchical Credit**: **297 rooms** were correctly classified at the parent category level despite fine-grained confusion.
4. **Targeted Taxonomy Validations**:
   - `Kitchen & Dining`: Preserved distinct combined-space identity (only 3.6% confused as Kitchen alone).
   - `Walk-in Closet`: Miss rate driven by small-room token resolution ($< 4\,\text{m}^2$) rather than taxonomy confusion.

---

## 🗺️ Experimental Roadmap & Research Trajectory

| Experiment | Focus & Intervention | Status | Role |
| :--- | :--- | :--- | :--- |
| **F2-A** | Original ViT-B/16 baseline on 75-split benchmark | **Preserved Baseline** | Benchmark reference |
| **G3-A** | Class-balanced semantic calibration & loss weighting | **Benchmark Reference** | Loss calibration test |
| **G3-B** | Two-Scale Query Pathway (20 Global + 20 High-Res P8 queries) | **Preserved Predecessor** | High-res pathway validation |
| **G3-C** | Iterative Bounding-Box Refinement (Inverse-Sigmoid deltas) | **Preserved Geometric Standard** | Coordinate refinement standard |
| **G4-A** | Hierarchical Functional Supervision (9 parent categories + consistency loss) | **Completed & Frozen** | Active best checkpoint |
| **G4-B** | Dynamic Instance Mask Head (High-Res FPN features for non-convex / L-shaped rooms) | **Approved Next** | Non-convex interior reconstruction |
| **G4-C** | Polygon Geometry Refinement (Contour extraction & polygon vertex approximation) | **Future Study** | CAD dimension finalization |
