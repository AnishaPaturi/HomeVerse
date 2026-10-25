# Model Checkpoint Registry & Benchmark Status

This document tracks the official model progression and validation checkpoints for the HomeVerse spatial architecture multi-task Vision Transformer (ViT-B/16 + FPN).

---

## 🏆 Current Model Status

- **Current Best Experimental Candidate**: [`checkpoints/multitask/experiment_g3c_best.pt`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/checkpoints/multitask/experiment_g3c_best.pt) (482.8 MB)
  - Architecture: Two-scale queries (20 Global + 20 High-Res P8) + Single-Layer Iterative Bounding Box Refinement Head.
  - Status: **Promoted as Active Best Checkpoint** following G3-C assessment.
- **Preserved Benchmark Baseline**: [`checkpoints/multitask/experiment_g3b_best.pt`](file:///C:/Users/anish/OneDrive/College/Projects/HomeVerse/checkpoints/multitask/experiment_g3b_best.pt) (481.7 MB)
  - Architecture: Two-scale queries (20 Global + 20 High-Res P8).
  - Status: **Preserved on Disk** for baseline comparison and regression testing.

---

## 📊 Benchmark Progression: G3-B vs. G3-C

Evaluated on the authoritative 75-layout unseen test benchmark (2,202 ground-truth rooms, 126 small rooms $< 6\,\text{m}^2$):

| Metric | G3-B Result | G3-C Result | Assessment | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Hungarian BBox IoU** | 0.5391 | **0.5466** | **Improved** | Layer 1 refinement established all-time project benchmark high |
| **Detection F1, IoU $\ge$ 0.25** | 0.5673 | **0.6131** | **Improved** | +4.58 percentage points gain |
| **Detection F1, IoU $\ge$ 0.50** | 0.3224 | **0.3746** | **Improved** | Significant improvement at optimal operating point (conf 0.05–0.10) |
| **Small-Room Recall, IoU $\ge$ 0.25** | 39.68% | 36.51% | Slight regression | Evaluated at nominal conf 0.20 (peaks at 50.00% at conf 0.05) |
| **Small-Room Recall, IoU $\ge$ 0.50** | 0.00% | **3.17%** | **Small improvement** | 4/126 small rooms recovered at CAD-standard tolerance |
| **Wall Mask Dice** | 0.8513 | **0.8495** | **Preserved** | $\sim$99.8% preservation of wall segmentation fidelity |
| **Scale Error** | 8.99% | **8.96%** | **Preserved** | Metric scale calibration preserved under 9% |
| **Semantic F1, IoU $\ge$ 0.50** | 0.0703 | **0.0768** | **Improved** | Class-aware F1 at nominal conf 0.20 (0.0841 at conf 0.05) |

---

## 🔬 Core Assessment Findings

1. **Refinement Improved Stricter Detection**: Detection F1 at $\text{IoU} \ge 0.50$ rose from 0.3224 to 0.3746 at the best reported operating point. Single-layer inverse-sigmoid coordinate updates successfully tightened boundaries on convex spaces and pruned 242 false positive boxes.
2. **Small-Room Detection Remains Unresolved**: While G3-C achieved 4/126 small rooms at $\text{IoU} \ge 0.50$ (3.17%) versus 0.00% in G3-B, this improvement does not yet constitute reliable small-room boundary recovery for production CAD generation.
3. **Refinement Geometry Trade-Off**: Matched room IoU shift analysis (42.9% improved vs. 36.7% regressed) demonstrates that refinement pulls coordinates toward the visual center of mass. This contracts irregular open spaces, truncating alcoves and corners in L-shaped rooms and connected living/dining areas.

---

## 🗺️ Experimental Roadmap & Research Trajectory

| Experiment | Focus & Intervention | Status |
| :--- | :--- | :--- |
| **F2-A** | Original ViT-B/16 baseline on 75-split benchmark | **Preserved Baseline** |
| **G3-A** | Class-balanced semantic calibration & loss weighting | **Benchmark Reference** |
| **G3-B** | Two-Scale Query Pathway (20 Global + 20 High-Res P8 queries) | **Preserved Predecessor** |
| **G3-C** | Iterative Bounding-Box Refinement (Inverse-Sigmoid deltas) | **Current Best Candidate** |
| **G4-A** | Hierarchical Functional Supervision (9 parent categories + consistency loss) | **In Progress** |
| **G4-B** | Dynamic Instance Mask Head (High-Res FPN features for non-convex / L-shaped rooms) | **Approved Next** |
| **G4-C** | Polygon Geometry Refinement (Contour extraction & polygon vertex approximation) | **Future Study** |

### Eventual Geometry Pipeline (Post-G4-A)
1. **Detect Room Instance**: Query localization via two-scale transformer decoders.
2. **Predict Dynamic Pixel Mask**: Per-query dynamic convolution over FPN features.
3. **Extract Outer Contour**: Snapping to wall segmentation boundaries.
4. **Approximate Polygon**: Vertex reduction for CAD representation.
5. **Compute Accurate Dimensions**: True polygonal area ($m^2$) for non-convex rooms (L-shaped living/dining).
6. **Apply Scale Calibration**: Millimeter-accurate dimension derivation.
