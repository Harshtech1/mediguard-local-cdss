# Gemini Image Generation API Pattern

Reference implementation for calling the Gemini image generation API. Claude should generate
a tailored script based on the user's needs rather than using this as-is.

## Core Pattern: Text-to-Image

```python
import base64, json, os, urllib.request, urllib.error

def generate_image(model, prompt, api_key, reference_path=None):
    """Generate an image via Gemini API. Returns raw image bytes."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    parts = []

    # Optional: style reference image
    if reference_path:
        with open(reference_path, "rb") as f:
            img_data = base64.b64encode(f.read()).decode()
        ext = reference_path.rsplit(".", 1)[-1].lower()
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                "webp": "image/webp"}.get(ext, "image/jpeg")
        parts.append({"inlineData": {"mimeType": mime, "data": img_data}})

    parts.append({"text": prompt})

    payload = json.dumps({
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "temperature": 0.7 if reference_path else 1.0,
        },
    }).encode()

    req = urllib.request.Request(url, data=payload,
        headers={"Content-Type": "application/json"}, method="POST")

    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode())

    # Extract image from response candidates
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "inlineData" in part:
                return base64.b64decode(part["inlineData"]["data"])

    # No image — check for text response (model may have refused)
    try:
        text = data["candidates"][0]["content"]["parts"][0].get("text", "")
        raise RuntimeError(f"Gemini returned text instead of image: {text}")
    except (KeyError, IndexError):
        raise RuntimeError(f"Unexpected response: {json.dumps(data)[:500]}")
```

## Key Details

**Response structure**: Gemini returns `candidates[].content.parts[]`. Each part is either
`{"text": "..."}` or `{"inlineData": {"mimeType": "image/png", "data": "<base64>"}}`.

**Temperature**: Use 0.7 with reference images (closer style match), 1.0 without (more creative).

**responseModalities**: Must include `"IMAGE"` to get image output. `["TEXT", "IMAGE"]` allows
the model to include both text and image parts.

## Multiple Variants

Generate N variants by calling the API N times:

```python
for i in range(count):
    img_bytes = generate_image(model, prompt, api_key, reference_path)
    if count > 1:
        base, ext = output_path.rsplit(".", 1)
        path = f"{base}-{i+1}.{ext}"
    else:
        path = output_path
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "wb") as f:
        f.write(img_bytes)
```

## Shell Escaping Warning

Never pass prompts via curl + bash — apostrophes and special characters break JSON.
Always use Python's `json.dumps()` for serialisation, or write the prompt to a file first.

## Model IDs

| Use case | Model | Cost |
|----------|-------|------|
| Drafts | `gemini-2.5-flash-image` | Free (~500/day) |
| Final assets | `gemini-3-pro-image-preview` | ~$0.04/image |

Verify model IDs if errors occur — they change frequently.
