import os
from PIL import Image

src_path = r"C:\Users\User\.gemini\antigravity\brain\b68a059b-3942-47a4-b1ba-e41bfc96a416\.user_uploaded\media_1793132946093_dd2ff014.png"
dest_webp = r"f:\Projects\Web Pribadi\assets\images\certificates\cert-hmti-iot-workshop-2026.webp"
dest_doc = r"C:\Users\User\Documents\Coolyeah\Sertifikat\Sertifikat Narasumber IoT Workshop HMTI ULM 2026.png"

im = Image.open(src_path)
print(f"Original format: {im.format}, size: {im.size}, mode: {im.mode}")

# Convert to RGB if RGBA/P
if im.mode in ("RGBA", "P"):
    im_rgb = im.convert("RGB")
else:
    im_rgb = im

# Resize nicely if width > 1400, or keep crisp
target_w = 1200
w, h = im_rgb.size
target_h = int(h * (target_w / w))
im_resized = im_rgb.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Save webp
im_resized.save(dest_webp, format="WEBP", quality=88, method=6)
print(f"Saved {dest_webp} (size: {os.path.getsize(dest_webp)} bytes, dims: {im_resized.size})")

# Save copy to user's Sertifikat folder
try:
    im.save(dest_doc)
    print(f"Saved copy to {dest_doc}")
except Exception as e:
    print(f"Failed to copy to Sertifikat: {e}")
