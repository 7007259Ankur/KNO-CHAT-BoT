import os
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from .rag import process_and_index, ask_question

# Use MongoDB if URI is configured, else fall back to Django ORM
USE_MONGO = bool(os.getenv("MONGODB_URI"))


def _upload_to_mongo(file, file_path, chunk_count):
    from .mongo import save_document
    return save_document(file.name, file_path, chunk_count)


def _upload_to_orm(file, file_path, chunk_count):
    from .models import Document
    doc = Document.objects.create(file=file, original_name=file.name, processed=True)
    return str(doc.id)


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_document(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    allowed = {".pdf", ".docx", ".txt"}
    ext = "." + file.name.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        return Response({"error": f"Unsupported file type. Allowed: {allowed}"}, status=400)

    # Save file to disk temporarily
    from django.conf import settings
    import os
    media_root = settings.MEDIA_ROOT
    os.makedirs(os.path.join(media_root, "docs"), exist_ok=True)
    file_path = os.path.join(media_root, "docs", file.name)
    with open(file_path, "wb") as f:
        for chunk in file.chunks():
            f.write(chunk)

    try:
        chunk_count = process_and_index(file_path)

        if USE_MONGO:
            _upload_to_mongo(file, file_path, chunk_count)
        else:
            from .models import Document
            Document.objects.create(file=f"docs/{file.name}", original_name=file.name, processed=True)

        return Response({
            "message": f"Uploaded and indexed '{file.name}' ({chunk_count} chunks).",
            "document": {"original_name": file.name, "chunk_count": chunk_count},
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def chat(request):
    query = request.data.get("query", "").strip()
    if not query:
        return Response({"error": "Query is required."}, status=400)

    try:
        result = ask_question(query)

        if USE_MONGO:
            from .mongo import save_chat
            saved = save_chat(query, result["answer"], result["sources"])
            return Response(saved)
        else:
            from .models import ChatMessage
            from .serializers import ChatMessageSerializer
            msg = ChatMessage.objects.create(
                question=query,
                answer=result["answer"],
                sources=result["sources"],
            )
            return Response(ChatMessageSerializer(msg).data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def chat_history(request):
    if USE_MONGO:
        from .mongo import list_chats
        return Response(list_chats())
    else:
        from .models import ChatMessage
        from .serializers import ChatMessageSerializer
        messages = ChatMessage.objects.order_by("-created_at")[:50]
        return Response(ChatMessageSerializer(messages, many=True).data)


@api_view(["GET"])
def list_documents(request):
    if USE_MONGO:
        from .mongo import list_documents
        return Response(list_documents())
    else:
        from .models import Document
        from .serializers import DocumentSerializer
        docs = Document.objects.order_by("-uploaded_at")
        return Response(DocumentSerializer(docs, many=True).data)
