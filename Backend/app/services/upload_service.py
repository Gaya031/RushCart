from fastapi import Request, UploadFile

from app.utils.file_upload import upload_file


async def upload_public_file(
    request: Request,
    file: UploadFile,
    *,
    sub_dir: str,
    allow_documents: bool = False,
) -> dict:
    uploaded_path = await upload_file(
        file=file,
        sub_dir=sub_dir,
        allow_documents=allow_documents,
    )
    base_url = str(request.base_url).rstrip("/")
    return {"url": f"{base_url}{uploaded_path}", "path": uploaded_path}

