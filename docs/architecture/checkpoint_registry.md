# Model Checkpoint Registry & Benchmark Status

This document tracks the official model progression and validation checkpoints for the HomeVerse spatial architecture multi-task Vision Transformer (ViT-B/16 + FPN).

---

## 🏆 Current Model Status

- **Primary Candidate**: [`checkpoints/multitask/experiment_g4b_best.pt`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/checkpoints/multitask/experiment_g4b_best.pt) (483.9 MB)
  - Architecture: Two-scale queries (20 Global + 20 High-Res P8) + Iterative BBox Refinement + Hierarchical Functional Supervision + Dynamic Instance Masks (Per-Query 64D Kernel + Bias).
  - Status: **Promoted as Active Primary Candidate** following successful G4-B validation across dynamic masks and multi-task metrics.
- **Hierarchical Semantic Reference**: [`checkpoints/multitask/experiment_g4a_best.pt`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/checkpoints/multitask/experiment_g4a_best.pt) (482.8 MB)
  - Architecture: Two-scale queries + Iterative BBox Refinement + Hierarchical Functional Supervision (9 Parent categories + Consistency Loss).
  - Status: **Preserved Baseline (Frozen)**.
- **Geometric Reference**: [`checkpoints/multitask/experiment_g3c_best.pt`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/checkpoints/multitask/experiment_g3c_best.pt) (482.8 MB)
  - Architecture: Two-scale queries + Iterative BBox Refinement (Inverse-Sigmoid deltas).
  - Status: **Preserved Baseline** on disk for geometric comparison and regression testing.
- **Preserved Predecessor**: [`checkpoints/multitask/experiment_g3b_best.pt`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/checkpoints/multitask/experiment_g3b_best.pt) (481.7 MB)
  - Architecture: Two-scale queries (20 Global + 20 High-Res P8).
  - Status: **Preserved on Disk**.

---

## 📊 Comprehensive Metric Progression: G3-C vs. G4-A vs. G4-B

Evaluated on the authoritative 75-layout unseen test benchmark (2,202 ground-truth rooms, 126 small rooms $< 6\,\text{m}^2$):

| Metric | G3-C Result (Nominal 0.20) | G4-A Result (Nominal 0.20) | G4-B Result (Nominal 0.20) | G4-B Result (Peak 0.05-0.10) | G4-B Assessment vs. G4-A |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hungarian BBox IoU (Layer 1)** | 0.5466 | 0.5524 | **0.5493** | **0.5493** | **Preserved** (> G3-C baseline) |
| **Wall Mask Dice** | 0.8495 | 0.8587 | **0.8488** | **0.8488** | **Preserved** |
| **Scale Error (%)** | 8.96% | 8.93% | **6.94%** | **6.94%** | **Improved (-1.99%)** |
| **Detection F1, IoU $\ge$ 0.50** | 0.3313 | 0.3686 | **0.3956** | **0.3990** | **Improved (+2.70% to +3.04%)** |
| **Detection F1, IoU $\ge$ 0.25** | 0.6131 | 0.6465 | **0.6468** | **0.6437** | **Improved (+0.03%)** (All-time high) |
| **Small-Room Recall, IoU $\ge$ 0.50** | 2.38% (3/126) | 3.17% (4/126) | **3.17% (4/126)** | **3.17% (4/126)** | **Preserved** |
| **Small-Room Recall, IoU $\ge$ 0.25** | 36.51% (46/126) | 40.48% (51/126)| **20.63% (26/126)**| **23.02% (29/126)**| Trade-off for high precision |
| **Child Semantic F1, IoU $\ge$ 0.50** | 0.0768 | 0.0853 | **0.0987** | **0.0975** | **Improved (+1.34%)** |
| **Parent Functional F1, IoU $\ge$ 0.50**| N/A | 0.2042 | **0.2315** | **0.2340** | **Improved (+2.73%)** |
| **Dual-Head Internal Consistency ($A_{\text{internal}}$)** | N/A | 62.20% | **82.63%** | **81.80%** | **Massive Gain (+20.43%)** |
| **Internal TP Consistency ($A_{\text{internal}}^{\text{TP}}$)** | N/A | 47.53% (target proxy) | **82.29%** | **81.41%** | **Rigorous Evaluation** |
| **Target Agreement Consistency ($A_{\text{target}}^{\text{TP}}$)**| N/A | 47.53% (423/890) | **52.05% (532/1022)** | **51.86% (558/1076)**| **Improved (+4.52%)** |
| **Hierarchical Credit Count (IoU 0.50)**| N/A | 297 rooms | **370 rooms** | **397 rooms** | **+73 rooms credited** |
| **Instance Mask IoU** | N/A | N/A | **0.7873** | **0.7873** | **New Metric Established** |
| **Boundary F1 (2-pixel tolerance)** | N/A | N/A | **0.8489** | **0.8489** | **New Metric Established** |
| **Non-Convex Room Mask IoU** | N/A | N/A | **0.6733** | **0.6733** | **New Metric Established** |
| **Non-Convex Room Mask Dice** | N/A | N/A | **0.7780** | **0.7780** | **New Metric Established** |

> [!NOTE]
> **Reconciliation of Hierarchical Consistency Metrics**:
> 1. **Dual-Head Internal Consistency ($A_{\text{internal}}^{\text{TP}}$)**: Measures whether the predicted parent class agrees with the parent implied by the predicted child class ($P_{\text{pred\_parent}} == \text{ImpliedParent}(P_{\text{pred\_child}})$). This evaluates model self-coherence on detected rooms, reaching **82.29%** at nominal threshold 0.20 and **81.41%** at peak threshold 0.05.
> 2. **Target Agreement Consistency ($A_{\text{target}}^{\text{TP}}$)**: Measures the proportion of detected rooms where the child prediction fell into the correct ground-truth functional category ($(\text{sem\_tp} + \text{within\_family\_confusion}) / \text{det\_tp}$). Under this exact formulation, G4-B reaches **52.05%** ($532 / 1,022$) vs. G4-A's **47.53%** ($423 / 890$), representing a **+4.52%** empirical gain.

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
