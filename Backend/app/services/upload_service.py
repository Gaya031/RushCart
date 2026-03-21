from fastapi import Request, UploadFile

from app.core.config import settings
from app.core.exceptions import ConflictException
from app.services.imagekit_service import upload_image_to_imagekit
from app.utils.file_upload import upload_file, ALLOWED_IMAGE_CONTENT_TYPES, ALLOWED_IMAGE_EXTENSIONS


def _is_image_upload(file: UploadFile) -> bool:
    content_type = (file.content_type or "").lower()
    if content_type in ALLOWED_IMAGE_CONTENT_TYPES or content_type.startswith("image/"):
        return True
    filename = file.filename or ""
    return any(filename.lower().endswith(ext) for ext in ALLOWED_IMAGE_EXTENSIONS)


async def upload_public_file(
    request: Request,
    file: UploadFile,
    *,
    sub_dir: str,
    allow_documents: bool = False,
) -> dict:
    if _is_image_upload(file):
        url = await upload_image_to_imagekit(
            file=file,
            folder=sub_dir,
            max_size_mb=settings.UPLOAD_MAX_IMAGE_SIZE_MB,
        )
        return {"url": url, "path": url}

    if allow_documents:
        uploaded_path = await upload_file(
            file=file,
            sub_dir=sub_dir,
            allow_documents=True,
        )
        base_url = str(request.base_url).rstrip("/")
        return {"url": f"{base_url}{uploaded_path}", "path": uploaded_path}

    raise ConflictException("Unsupported file type")
