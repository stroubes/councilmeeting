#!/usr/bin/env python3
"""Generate images using MiniMax Image-01 API."""
import base64
import json
import os
import sys
import requests

API_URL = "https://api.minimax.io/v1/image_generation"
API_KEY = os.environ.get("MINIMAX_API_KEY")

def generate_image(prompt: str, output_path: str, aspect_ratio: str = "16:9") -> str:
    """Generate an image and save to disk. Returns the output path."""
    if not API_KEY:
        raise ValueError("MINIMAX_API_KEY environment variable not set")

    response = requests.post(
        API_URL,
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={
            "model": "image-01",
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "response_format": "base64",
        },
        timeout=120,
    )
    response.raise_for_status()

    images = response.json()["data"]["image_base64"]
    if not images:
        raise RuntimeError("No images returned from API")

    with open(output_path, "wb") as f:
        f.write(base64.b64decode(images[0]))

    print(f"Generated: {output_path}")
    return output_path

if __name__ == "__main__":
    prompt = "City council chamber with elected officials debating, mayor at center podium, council members seated in semicircular rows, formal government meeting room, photorealistic style, natural lighting from tall windows, professional atmosphere, high detail, sharp focus, commercial quality"
    output = "assets/images/council-chambers-debate.jpeg"
    ratio = "16:9"
    generate_image(prompt, output, ratio)