from __future__ import annotations

import base64
from pathlib import Path

import httpx
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ConflictException
from app.core.logging import logger
from app.utils.file_upload import ALLOWED_IMAGE_CONTENT_TYPES, ALLOWED_IMAGE_EXTENSIONS


def _require_imagekit_config() -> None:
    if not settings.IMAGEKIT_PRIVATE_KEY or not settings.IMAGEKIT_URL_ENDPOINT:
        raise ConflictException("ImageKit is not configured")


def _normalize_folder(folder: str) -> str:
    trimmed = (folder or "").strip().strip("/")
    return f"/{trimmed}" if trimmed else "/"


async def _validate_image_file(file: UploadFile, max_size_mb: int) -> tuple[bytes, str]:
    if not file or not file.filename:
        raise ConflictException("File is required")

    content_type = (file.content_type or "").lower()
    ext = Path(file.filename).suffix.lower()

    is_image_content = content_type in ALLOWED_IMAGE_CONTENT_TYPES or content_type.startswith("image/")
    is_image_ext = ext in ALLOWED_IMAGE_EXTENSIONS
    if not is_image_content and not is_image_ext:
        raise ConflictException("Unsupported image type")

    content = await file.read()
    if not content:
        raise ConflictException("Uploaded file is empty")

    max_size_bytes = max_size_mb * 1024 * 1024
    if len(content) > max_size_bytes:
        raise ConflictException(f"Image size exceeds {max_size_mb}MB limit")

    return content, file.filename


async def upload_image_to_imagekit(
    *,
    file: UploadFile,
    folder: str,
    max_size_mb: int,
) -> str:
    _require_imagekit_config()
    content, filename = await _validate_image_file(file, max_size_mb)
    encoded = base64.b64encode(content).decode("utf-8")

    auth = (settings.IMAGEKIT_PRIVATE_KEY, "")
    payload = {
        "file": encoded,
        "fileName": filename or "upload.jpg",
        "folder": _normalize_folder(folder),
        "useUniqueFileName": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
            response = await client.post(
                "https://upload.imagekit.io/api/v1/files/upload",
                data=payload,
                auth=auth,
            )
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        logger.warning("ImageKit upload failed: %s", str(exc))
        raise ConflictException("Image upload failed") from exc
    finally:
        try:
            await file.close()
        except Exception:
            pass

    url = data.get("url")
    if not url:
        raise ConflictException("Image upload failed")
    return url
