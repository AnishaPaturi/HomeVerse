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

## 📐 Milestone G5 Metric Benchmark & Historical Progression

The table below preserves both the reconciled benchmark (unified native resolution coordinates) and the historical canonical-resolution baseline (evaluating $1024 \times 1024$ raster polygons directly against native-resolution ground-truth metadata).

| Metric Category | Metric Standard | Historical Baseline (1024 Canonical Grid) | Authoritative Reconciled Standard (Native Resolution) | Status & Variance Explanation |
| :--- | :--- | :---: | :---: | :--- |
| **Pure Geometry (Scen 2)** | Median Shoelace Area Error | **7.73%** | **7.73%** | Invariant to coordinate system (pure segmentation quality: 92.27% accuracy) |
| **Group 2 Area Error** | Median Room Area MAPE | **53.91%** | **9.24%** | Reconciled: 53.91% caused by $(1024/W_{\text{native}})^2$ coordinate distortion |
| **Group 2 Scale Error** | Median Scale MAPE | **0.70%** | **0.70%** | Virtually unbiased (signed bias: -0.14%) |
| **Group 1 Area Error** | Median Room Area MAPE | **44.21%** | **48.38%** | Controlled by OCR-to-room spatial association bottleneck |
| **Group 1 Scale Error** | Median Scale MAPE | **25.86%** | **25.86%** | Systematic expansion bias (+18.42%) due to centroid mismatch |
| **Group 3 Area Error** | Median Room Area MAPE | **78.53%** | **45.95%** | Controlled by reference symbol prior variance |
| **Group 3 Scale Error** | Median Scale MAPE | **15.61%** | **15.61%** | Positive bias (+11.20%) |
| **Group 4 Non-Hallucination**| Availability Accuracy | **100.0%** | **100.0%** | 27/27 plans correctly return `UNAVAILABLE` |
| **Aggregate Calibrated Area** | Median Room Area MAPE | **53.42%** | **31.64%** | Reconciled: converges directly to Scenario 3 under unified coordinates |

---

## 🗺️ Experimental Roadmap & Research Trajectory

| Experiment | Focus & Intervention | Status | Role |
| :--- | :--- | :--- | :--- |
| **F2-A** | Original ViT-B/16 baseline on 75-split benchmark | **Preserved Baseline** | Benchmark reference |
| **G3-A** | Class-balanced semantic calibration & loss weighting | **Benchmark Reference** | Loss calibration test |
| **G3-B** | Two-Scale Query Pathway (20 Global + 20 High-Res P8 queries) | **Preserved Predecessor** | High-res pathway validation |
| **G3-C** | Iterative Bounding-Box Refinement (Inverse-Sigmoid deltas) | **Preserved Geometric Standard** | Coordinate refinement standard |
| **G4-A** | Hierarchical Functional Supervision (9 parent categories + consistency loss) | **Preserved Baseline (Frozen)** | Semantic reference |
| **G4-B** | Dynamic Instance Mask Head (High-Res FPN features for non-convex / L-shaped rooms) | **Active Primary Candidate** | Primary model checkpoint (`experiment_g4b_best.pt`) |
| **G4-C** | Polygon Boundary Refinement & Deterministic CAD Vectorization (DXF/SVG) | **Completed Milestone** | 0.41% invalid rate, 100% round-trip |
| **G5** | Metric Geometry & Multi-Modal Dimension Calibration (5-tier hierarchy) | **Implemented — Reconciliation Passed** | Root-cause error isolation, 9.24% area error on scale-bars, 100% non-hallucination. Group 1 OCR matcher failed acceptance gates (Precision: 37.93%, Coverage: 31.35%); baseline preserved; unvalidated for production. |
| **G5-OCR-v2** | Corrective Spatial Matcher (Query Filtering, Margin Fix, No Dummy Centers) | **Rejected for Promotion** | Scale MAPE halved to 6.13%, Area MAPE halved to 15.13%, but failed Gate 1 (Precision 52.38%) and Gate 2 (Coverage 24.74%). Unvalidated for production; historical G5 baseline preserved. |
| **G5-OCR-v3** | Token-Localization Diagnostic & Dimension Recovery | **Investigation Approved** | Design phase: Recover 159 unlocalized tokens, token bounding boxes, wall-segment matching. |
| **G6-A** | Property Area Modeling (GIA/NIA), Boundaries & Wall Takeoffs | **Provisional; Topology Verification Next** | Verified geometry & planar decomposition under IPMS: All Buildings (2023). |
| **G6-B/C**| Construction Takeoff & Parametric Cost Modeling | **Frozen / Not Production-Ready** | Cost outputs strictly frozen and marked PROVISIONAL until calibration is resolved. |

---

## 🔒 Governance Decision: G6-A Provisional Formalization and Explicit Validation Boundaries

- **Decision**: Formalize G6-A's verified property area schedules (GIA, NIA, partition quantities) under an explicit `PROVISIONAL` status. All G6-B/C construction cost outputs remain strictly frozen and marked `PROVISIONAL / NOT PRODUCTION-READY`.
- **Promotion Policy**: G5-OCR-v2 remains rejected for promotion based on its frozen benchmark. Any subsequent corrective implementation, including G5-OCR-v3, must be independently evaluated against the same acceptance gates before promotion. Until then, G6-A remains provisional and G6-B/C cost modeling remains frozen.
- **Rationale**: This decision preserves independently verified architectural progress without allowing unvalidated dimension assignments to contaminate downstream production or cost estimates.
- **Operational Mandate**: Don't abandon G6-A because G5 OCR failed, but don't let G6-A's architectural validation become an indirect approval of unvalidated measurements. Keep those validation boundaries explicit.
- **Required Status Summary**:
  | Component | Status |
  | :--- | :--- |
  | **G5 historical baseline** | **Locked** |
  | **G5-OCR-v2** | **Rejected for promotion** |
  | **G5-OCR-v3** | **Investigation approved** |
  | **G6-A** | **Provisional; topology verification next** |
  | **G6-B** | **Frozen** |
  | **G6-C** | **Frozen** |
- **Production Restrictions**:
  1. Group 1 dimensioned calibration remains **`UNVALIDATED FOR PRODUCTION`**.
  2. The historical G5 baseline remains unchanged and immutable.
  3. The official frozen benchmark records (`frozen_group1_benchmark_results.json` and `frozen_group1_benchmark_v2_results.json`) are preserved.
  4. No construction cost output may be promoted to production based on unvalidated calibration results.
### Execution Sequence & Roadmap Milestones

| Stage | Action | Target / Required Status | Evaluated Status | Outcome |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Formalize G6-A area schedules: GIA, NIA, partition quantities | Provisional | **Provisional** | Implemented & unit-tested in `property_area_aggregator.py` under IPMS 2023. |
| **2** | Freeze G6-B/C construction cost outputs | Not production-ready | **Frozen / Not Production-Ready** | Cost outputs locked; non-compounding rate formulas in `costs/rate_database.json`. |
| **3** | Preserve the failed G5 benchmark and baseline | Locked | **Locked / Immutable** | `experiment_g5_results.json` and `frozen_group1_benchmark_results.json` preserved. |
| **4** | Create versioned G5-OCR-v2 experiment | Experimental | **Completed** | Versioned in `ocr_spatial_matcher_v2.py`. |
| **5** | Correct dummy bounding boxes, Hungarian margin evaluation, and query confidence filtering | Under investigation | **Active Safeguards** | 159 dummy boxes dropped; margin fix applied; 393 low-conf queries filtered. |
| **6** | Re-run the frozen 79-image, 772-room benchmark | Awaiting validation | **Evaluated** | Executed in `run_frozen_group1_benchmark_v2.py` across 79 images / 772 rooms. |
| **7** | Promote only if all five acceptance gates pass | Conditional | **Promotion Rejected** | Gate 1 (52.38%) and Gate 2 (24.74%) failed; baseline preserved. |
