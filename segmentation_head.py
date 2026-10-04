import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


# =====================================================================
# Segmentation Head Architecture
# =====================================================================

class PixelDecoder(nn.Module):
    """
    Upsamples ViT patch tokens from (H/16, W/16) to (H/4, W/4) feature maps.
    Works dynamically for any input patch grid size (e.g. 14x14 for 224, 24x24 for 384).
    """
    def __init__(self, in_dim=768, hidden_dim=256, out_dim=64):
        super().__init__()
        self.conv1 = nn.Sequential(
            nn.ConvTranspose2d(in_dim, hidden_dim, kernel_size=2, stride=2),
            nn.BatchNorm2d(hidden_dim),
            nn.GELU(),
        )
        self.conv2 = nn.Sequential(
            nn.ConvTranspose2d(hidden_dim, 128, kernel_size=2, stride=2),
            nn.BatchNorm2d(128),
            nn.GELU(),
        )
        self.conv3 = nn.Sequential(
            nn.Conv2d(128, out_dim, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_dim),
            nn.GELU(),
        )

    def forward(self, patch_tokens, grid_size=None):
        """
        patch_tokens: [B, N_patches, in_dim]
        grid_size: (H_patches, W_patches)
        """
        B, N, C = patch_tokens.shape
        if grid_size is None:
            side = int(N ** 0.5)
            grid_size = (side, side)

        gh, gw = grid_size
        feat_map = patch_tokens.permute(0, 2, 1).contiguous().view(B, C, gh, gw)
        x = self.conv1(feat_map)   # 2x upsample
        x = self.conv2(x)          # 4x upsample
        x = self.conv3(x)          # refined feature map [B, out_dim, gh*4, gw*4]
        return x


class SegmentationHead(nn.Module):
    """
    Multi-task instance & semantic segmentation head for floor plans.
    
    Produces:
      1. Instance Mask per Room Query: [B, num_queries, H_mask, W_mask]
      2. Semantic Room Segmentation Map: [B, num_classes + 1, H_mask, W_mask]
    """
    def __init__(self, in_dim=768, num_queries=25, num_classes=22, mask_dim=64):
        super().__init__()
        self.num_queries = num_queries
        self.num_classes = num_classes
        self.mask_dim = mask_dim

        self.pixel_decoder = PixelDecoder(in_dim=in_dim, hidden_dim=256, out_dim=mask_dim)

        # Query mask projection: maps each query vector to a mask projection weight
        self.query_mask_proj = nn.Sequential(
            nn.Linear(in_dim, 256),
            nn.ReLU(),
            nn.Linear(256, mask_dim),
        )

        # Direct semantic segmentation head
        self.semantic_head = nn.Sequential(
            nn.Conv2d(mask_dim, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, num_classes + 1, kernel_size=1),
        )

    def forward(self, patch_tokens, query_embeds, grid_size=None):
        """
        patch_tokens: [B, N_patches, 768] (excluding CLS token)
        query_embeds: [B, num_queries, 768] from Transformer Decoder
        grid_size: tuple (H_patches, W_patches)
        """
        # 1. High-resolution pixel feature map [B, mask_dim, H_mask, W_mask]
        pixel_feat = self.pixel_decoder(patch_tokens, grid_size=grid_size)

        # 2. Query mask kernels [B, num_queries, mask_dim]
        mask_kernels = self.query_mask_proj(query_embeds)

        # 3. Instance masks: [B, num_queries, H_mask, W_mask] via einsum
        pred_instance_masks = torch.einsum("bqc,bchw->bqhw", mask_kernels, pixel_feat)

        # 4. Semantic map: [B, num_classes + 1, H_mask, W_mask]
        pred_semantic = self.semantic_head(pixel_feat)

        return {
            "pred_masks": pred_instance_masks,
            "pred_semantic": pred_semantic,
            "pixel_feat": pixel_feat,
        }


# =====================================================================
# Segmentation Losses: BCE + Dice
# =====================================================================

def dice_loss(inputs, targets, eps=1e-5):
    """
    inputs: Tensor of arbitrary shape (logits)
    targets: Tensor of same shape as inputs (values in [0, 1])
    """
    probs = inputs.sigmoid().flatten(1)
    targets = targets.flatten(1)
    intersection = 2.0 * (probs * targets).sum(dim=-1) + eps
    union = probs.sum(dim=-1) + targets.sum(dim=-1) + eps
    loss = 1.0 - (intersection / union)
    return loss.mean()


def sigmoid_ce_loss(inputs, targets):
    """
    Binary Cross Entropy with logits loss.
    """
    return F.binary_cross_entropy_with_logits(inputs, targets, reduction="mean")


def compute_mask_loss(pred_masks, matched_gt_masks):
    """
    Combined BCE + Dice Loss for instance room segmentation.
    pred_masks: [K, H, W]
    matched_gt_masks: [K, H, W]
    """
    if pred_masks.numel() == 0 or matched_gt_masks.numel() == 0:
        return torch.tensor(0.0, device=pred_masks.device)

    loss_ce = sigmoid_ce_loss(pred_masks, matched_gt_masks)
    loss_dice = dice_loss(pred_masks, matched_gt_masks)
    return loss_ce + loss_dice, loss_ce, loss_dice


# =====================================================================
# Room Contour & Geometry Extraction
# =====================================================================

def extract_room_geometry_from_mask(mask_prob, threshold=0.5, orig_size=(1024, 1024), min_area_px=60):
    """
    Extracts room boundary polygon, oriented dimensions, and contour area from a predicted mask.
    
    Args:
        mask_prob: 2D numpy array [H, W] float in [0, 1]
        threshold: binarization threshold
        orig_size: (orig_width, orig_height) in pixels
        min_area_px: minimum pixel area to filter spurious noise
        
    Returns:
        dict with:
            - polygon: list of [x, y] normalized vertices
            - pixel_width: oriented width in pixels
            - pixel_length: oriented length in pixels
            - pixel_area: true contour area in pixels^2
            - bbox_pixels: [x0, y0, w, h] in pixels
            - bbox_normalized: [x0, y0, w, h] normalized in [0, 1]
            - is_rectangular: boolean flag
            - num_vertices: number of polygon vertices
    """
    orig_w, orig_h = orig_size
    mh, mw = mask_prob.shape

    if (mw, mh) != (orig_w, orig_h):
        mask_full = cv2.resize(mask_prob, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
    else:
        mask_full = mask_prob

    binary = (mask_full >= threshold).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    # Select largest contour
    contour = max(contours, key=cv2.contourArea)
    area_px = float(cv2.contourArea(contour))
    if area_px < min_area_px:
        return None

    peri = cv2.arcLength(contour, True)
    approx_poly = cv2.approxPolyDP(contour, 0.02 * peri, True)

    # Oriented minimum-area bounding box
    rect = cv2.minAreaRect(contour)
    (rcx, rcy), (rw, rh), angle = rect
    oriented_w = float(min(rw, rh))
    oriented_l = float(max(rw, rh))

    # Axis-aligned bounding box from contour
    bx, by, bw, bh = cv2.boundingRect(contour)

    # Normalized polygon coordinates
    poly_norm = [[round(float(pt[0][0]) / orig_w, 4), round(float(pt[0][1]) / orig_h, 4)] for pt in approx_poly]

    # Check rectangularity
    rect_area = max(1e-3, rw * rh)
    rectangularity = area_px / rect_area
    is_rectangular = (rectangularity >= 0.80) and (len(approx_poly) == 4)

    return {
        "polygon": poly_norm,
        "num_vertices": len(approx_poly),
        "is_rectangular": bool(is_rectangular),
        "pixel_width": round(oriented_w, 1),
        "pixel_length": round(oriented_l, 1),
        "pixel_area": round(area_px, 1),
        "bbox_pixels": [int(bx), int(by), int(bw), int(bh)],
        "bbox_normalized": [
            round(bx / orig_w, 4),
            round(by / orig_h, 4),
            round(bw / orig_w, 4),
            round(bh / orig_h, 4),
        ],
    }
