# HomeVerse Vision Transformer (ViT) Dimension Intelligence Layer

This subproject provides metric dimension prediction and geometric scale validation for HomeVerse 2D floor plans, specifically powering **Step 6 (AI Detection)** and **Step 7 (Dimension Confirmation & Adjustment)** in the project setup wizard.

---

## 1. Architecture Overview

```text
Floor Plan Image (PNG/JPEG) + Room Conditioning Token ("Living Room")
                          │
                          ▼
            Vision Transformer Backbone
         (Patch Embeddings 16x16 + Multi-Head Self-Attention)
                          │
                          ▼
                   Image Feature [CLS]
                          │
                          ▼
        Concatenate with Learned Room Embedding
                          │
                          ▼
            Multi-Layer Dimension Regression Head
                          │
                          ▼
        Raw Predictions: (Width, Depth, Area, Confidence)
                          │
                          ▼
            Physical & Geometric Validation Engine
      (Sanity checks: Area ≈ Width × Depth, Bounds: 1.0m - 25.0m)
                          │
                          ▼
              Canonical Scene Room Object
        { "room_name": "Living Room", "width": 5.5, "depth": 6.5, "height": 2.8, "area": 35.75 }
```

---

## 2. Directory Structure

```text
ml/dimension-vit/
├── configs/
│   └── config.yaml            # Hyperparameters, splits, and room vocabulary
├── dataset/
│   ├── generator.py           # Procedural architectural CAD floor plan generator
│   └── data/
│       ├── images/            # Rendered 2D CAD floor plan images (512x512)
│       └── annotations/       # Ground-truth JSONs with bounding boxes and metric dimensions
├── models/
│   ├── heads.py               # Positive-bounded dimension MLP regression head
│   └── vit_dimension.py       # Vision Transformer backbone with room-token conditioning
├── training/
│   ├── dataset.py             # PyTorch Dataset, DataLoader, in-memory caching
│   ├── metrics.py             # MAE, RMSE, MAPE, and geometric consistency calculations
│   ├── validate.py            # Validation loop
│   └── train.py               # Multi-task training script with gradient clipping & AdamW
├── inference/
│   └── predict.py             # Standalone predictor with geometric reconciliation
├── checkpoints/
│   └── vit_dimension_best.pth # Best trained model checkpoint
├── requirements.txt           # Python ML dependencies
└── README.md
```

---

## 3. Usage & CLI Commands

### Generate Procedural Floor Plans
```bash
python ml/dimension-vit/dataset/generator.py --count 100 --output ml/dimension-vit/dataset/data
```

### Train the ViT Dimension Model
```bash
python ml/dimension-vit/training/train.py --epochs 10
```

### Standalone Inference
```bash
python ml/dimension-vit/inference/predict.py --image ml/dimension-vit/dataset/data/images/floor_000001.png --room "Living Room"
```

---

## 4. Production API Serving

The trained model is served via FastAPI through `backend/app/ai/dimension_service.py` at:
- `POST /api/ai/floorplan/dimensions` (Multipart file upload or base64)
- `POST /api/ai/floorplan/dimensions/json` (JSON base64 or URL)

### Test the Endpoint
```bash
pytest backend/tests/test_vit_dimension_api.py -v
```
