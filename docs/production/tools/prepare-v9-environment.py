#!/usr/bin/env python3
"""Selective PixelOE surface pass; does not modify original art or game code."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image, ImageDraw


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pixeloe-source", type=Path, required=True)
    args = parser.parse_args()
    sys.path.insert(0, str(args.pixeloe_source.resolve() / "src"))
    from pixeloe.legacy.pixelize import pixelize

    root = Path(__file__).resolve().parents[3]
    source = root / "dist/assets/lunar-vault-v6.png"
    target = root / "dist/assets/v9/environment/b5-moonstone-vault.png"
    evidence = root / "docs/visual/implemented/v9/environment"
    target.parent.mkdir(parents=True, exist_ok=True)
    evidence.mkdir(parents=True, exist_ok=True)
    before_hash = digest(source)
    original = cv2.imread(str(source), cv2.IMREAD_COLOR)
    height, width = original.shape[:2]
    assert (width, height) == (1672, 941), "Mask coordinates require original V6 canvas"

    torch.set_num_threads(2)
    cv2.setNumThreads(2)
    padded = cv2.copyMakeBorder(original, 0, (-height) % 4, 0, (-width) % 4, cv2.BORDER_REPLICATE)
    ph, pw = padded.shape[:2]
    processed = pixelize(
        padded,
        mode="contrast",
        target_size=(pw // 4, ph // 4),
        patch_size=4,
        pixel_size=4,
        thickness=1,
        color_matching=True,
        contrast=1.0,
        saturation=1.0,
        colors=None,
        no_upscale=False,
    )
    native_shape = [processed.shape[1], processed.shape[0]]
    # Legacy API truncates floating-point target dimensions; restore the padded
    # canvas by nearest-neighbour resampling before dropping its bottom padding.
    processed = cv2.resize(processed, (pw, ph), interpolation=cv2.INTER_NEAREST)[:height, :width]
    assert processed.shape == original.shape

    # Only exposed stone floor and two narrow wall strips receive PixelOE.
    region = np.zeros((height, width), np.uint8)
    polygons = [
        [(285, 458), (690, 291), (1087, 310), (1395, 459), (1260, 614), (894, 804), (445, 664)],
        [(259, 43), (310, 40), (309, 211), (280, 244), (259, 220)],
        [(1458, 116), (1504, 120), (1538, 307), (1505, 332), (1477, 302)],
    ]
    cv2.fillPoly(region, [np.array(points, np.int32) for points in polygons], 255)
    # Preserve the complete focal moon seal instead of pixelating its gold rings.
    cv2.ellipse(region, (967, 412), (278, 133), 0, 0, 360, 0, -1)
    edge = cv2.GaussianBlur(region.astype(np.float32) / 255, (0, 0), 12)
    edge *= region > 0

    b, g, r = [original[:, :, i].astype(np.float32) for i in range(3)]
    warm = (r > 100) & (r > g * 1.08) & (r > b * 1.16)
    cyan = (b > 145) & (g > 90) & (b > r * 1.45)
    bright = (0.2126 * r + 0.7152 * g + 0.0722 * b) > 165
    protected = warm | cyan | bright
    protection = cv2.GaussianBlur(protected.astype(np.float32), (0, 0), 5)
    # Keep stone grout and carved line silhouettes; PixelOE only tidies the
    # remaining surface texture, rather than replacing detailed architecture.
    gray = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gradient = cv2.magnitude(cv2.Sobel(gray, cv2.CV_32F, 1, 0), cv2.Sobel(gray, cv2.CV_32F, 0, 1))
    line_protection = cv2.GaussianBlur((gradient > 95).astype(np.float32), (0, 0), 1.2)
    mask = edge * (1 - np.clip(protection * 1.6, 0, 1)) * (1 - np.clip(line_protection * 2, 0, 1)) * 0.38
    mask[protected] = 0
    mixed = np.rint(original.astype(np.float32) * (1 - mask[..., None]) + processed.astype(np.float32) * mask[..., None]).clip(0, 255).astype(np.uint8)
    assert np.array_equal(mixed[region == 0], original[region == 0])
    assert np.array_equal(mixed[protected], original[protected])
    assert digest(source) == before_hash
    assert cv2.imwrite(str(target), mixed, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    assert cv2.imwrite(str(evidence / "b5-surface-mask.png"), np.rint(mask * 255).astype(np.uint8))

    # A full-frame comparison plus a 1:1 floor crop makes subtle changes reviewable.
    source_rgb = Image.fromarray(cv2.cvtColor(original, cv2.COLOR_BGR2RGB))
    result_rgb = Image.fromarray(cv2.cvtColor(mixed, cv2.COLOR_BGR2RGB))
    sheet = Image.new("RGB", (1280, 760), "#121a24")
    draw = ImageDraw.Draw(sheet)
    draw.text((16, 8), "V6 SOURCE - unchanged", fill="#e6eaf2")
    draw.text((656, 8), "V9 B5 - selective PixelOE stone surface pass", fill="#e6eaf2")
    for x, im in [(0, source_rgb), (640, result_rgb)]:
        sheet.paste(im.resize((640, 360), Image.Resampling.LANCZOS), (x, 32))
        sheet.paste(im.crop((555, 533, 1187, 865)), (x + 4, 422))
    draw.text((16, 402), "Stone floor crop - 1:1 source pixels", fill="#e6eaf2")
    draw.text((656, 402), "Same crop - lighting and gold reflections protected", fill="#e6eaf2")
    sheet.save(evidence / "b5-before-after.png", optimize=True)

    difference = np.abs(mixed.astype(np.int16) - original.astype(np.int16))
    metrics = {
        "source": source.relative_to(root).as_posix(),
        "source_sha256": before_hash,
        "output": target.relative_to(root).as_posix(),
        "output_sha256": digest(target),
        "size": [width, height],
        "pixeloe_target_size": [pw // 4, ph // 4],
        "pixeloe_native_output_size": native_shape,
        "mask_nonzero_percent": round(float(np.mean(mask > 0) * 100), 3),
        "changed_pixels_percent": round(float(np.mean(np.any(difference > 0, axis=2)) * 100), 3),
        "mean_absolute_channel_difference": round(float(difference.mean()), 4),
        "unmasked_pixels_exactly_preserved": True,
        "protected_lighting_pixels_exactly_preserved": True,
        "versions": {"torch": torch.__version__, "numpy": np.__version__, "opencv": cv2.__version__},
    }
    (evidence / "b5-generation.json").write_text(json.dumps(metrics, indent=2) + "\n")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
