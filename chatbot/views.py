import os
import threading
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from .rag import process_and_index, ask_question

USE_MONGO = bool(os.getenv("MONGODB_URI"))


def _process_in_background(file_path: str, file_name: str):
    """Run indexing in a background thread so upload returns immediately."""
    try:
        print(f"[RAG] Starting indexing for '{file_name}'...")
        chunk_count = process_and_index(file_path)
        print(f"[RAG] Indexed '{file_name}' — {chunk_count} chunks")
        if USE_MONGO:
            from .mongo import save_document
            save_document(file_name, file_path, chunk_count)
            print(f"[RAG] Saved '{file_name}' to MongoDB")
        else:
            from .models import Document
            Document.objects.filter(original_name=file_name).update(processed=True)
    except Exception as e:
        import traceback
        print(f"[RAG] Error indexing '{file_name}': {e}")
        print(traceback.format_exc())


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_document(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "No file provided."}, status=400)

    allowed = {".pdf", ".docx", ".txt"}
    ext = "." + file.name.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        return Response({"error": f"Unsupported file type. Allowed: {allowed}"}, status=400)

    # Save file to disk
    from django.conf import settings
    media_root = settings.MEDIA_ROOT
    os.makedirs(os.path.join(media_root, "docs"), exist_ok=True)
    file_path = os.path.join(media_root, "docs", file.name)
    with open(file_path, "wb") as f:
        for chunk in file.chunks():
            f.write(chunk)

    # Create DB record immediately
    if not USE_MONGO:
        from .models import Document
        Document.objects.create(
            file=f"docs/{file.name}",
            original_name=file.name,
            processed=False
        )

    # Process in background — don't block the response
    thread = threading.Thread(
        target=_process_in_background,
        args=(file_path, file.name),
        daemon=True
    )
    thread.start()

    return Response({
        "message": f"'{file.name}' uploaded. Indexing in progress...",
        "document": {"original_name": file.name},
    })


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
