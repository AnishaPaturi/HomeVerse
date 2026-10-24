import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import torch
from run_experiment_g3b import MultiTaskViT384FPNTwoScale

m = MultiTaskViT384FPNTwoScale(img_size=384)
m.eval()

x = torch.randn(2, 3, 384, 384)

with torch.no_grad():
    enc = m.encoder(x, output_hidden_states=True)
    cls_tok = enc.last_hidden_state[:, 0, :]
    f6 = enc.hidden_states[6][:, 1:, :]
    f9 = enc.hidden_states[9][:, 1:, :]
    f12 = enc.hidden_states[12][:, 1:, :]

    out1 = m(x)

    # Manual forward_with_features
    pred_log_scale = m.scale_head(cls_tok).squeeze(-1)
    pred_scale = torch.exp(pred_log_scale)
    pixel_feat, pyramid = m.fpn(f6, f9, f12, grid_size=m.grid_size)
    p8 = pyramid["p8"]
    mem_highres = m.p8_proj(p8).flatten(2).permute(0, 2, 1)
    queries_g = m.query_embed_global.weight.unsqueeze(0).expand(2, -1, -1)
    hs_global = m.decoder_global(tgt=queries_g, memory=f12)
    queries_hr = m.query_embed_highres.weight.unsqueeze(0).expand(2, -1, -1)
    hs_highres = m.decoder_highres(tgt=queries_hr, memory=mem_highres)
    hs = torch.cat([hs_global, hs_highres], dim=1)
    pred_logits = m.class_head(hs)
    pred_boxes = m.bbox_head(hs)
    q_masks = m.query_mask_proj(hs)
    pred_masks = torch.einsum("bqc,bchw->bqhw", q_masks, pixel_feat)

    diff_logits = (out1["pred_logits"] - pred_logits).abs().max().item()
    diff_boxes = (out1["pred_boxes"] - pred_boxes).abs().max().item()
    diff_masks = (out1["pred_masks"] - pred_masks).abs().max().item()
    print(f"Max diff in logits: {diff_logits:.8f}")
    print(f"Max diff in boxes:  {diff_boxes:.8f}")
    print(f"Max diff in masks:  {diff_masks:.8f}")
    assert diff_logits < 1e-5 and diff_boxes < 1e-5 and diff_masks < 1e-5, "Mismatch!"
    print("Exact numerical equivalence confirmed!")
