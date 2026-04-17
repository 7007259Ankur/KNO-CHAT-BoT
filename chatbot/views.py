import os
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .rag import process_and_index, ask_question

USE_MONGO = bool(os.getenv("MONGODB_URI"))


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

    from django.conf import settings
    media_root = settings.MEDIA_ROOT
    os.makedirs(os.path.join(media_root, "docs"), exist_ok=True)
    file_path = os.path.join(media_root, "docs", file.name)
    with open(file_path, "wb") as f:
        for chunk in file.chunks():
            f.write(chunk)

    try:
        print(f"[RAG] Indexing '{file.name}'...")
        chunk_count = process_and_index(file_path)
        print(f"[RAG] Done — {chunk_count} chunks")

        if USE_MONGO:
            from .mongo import save_document
            save_document(file.name, file_path, chunk_count)
        else:
            from .models import Document
            Document.objects.create(
                file=f"docs/{file.name}",
                original_name=file.name,
                processed=True
            )

        return Response({
            "message": f"'{file.name}' uploaded and indexed ({chunk_count} chunks).",
            "document": {"original_name": file.name, "chunk_count": chunk_count},
        })
    except Exception as e:
        import traceback
        print(f"[RAG] Error:\n{traceback.format_exc()}")
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
            return Response(save_chat(query, result["answer"], result["sources"]))
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
        import traceback
        print(f"[CHAT] Error:\n{traceback.format_exc()}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def chat_history(request):
    if USE_MONGO:
        from .mongo import list_chats
        return Response(list_chats())
    from .models import ChatMessage
    from .serializers import ChatMessageSerializer
    return Response(ChatMessageSerializer(
        ChatMessage.objects.order_by("-created_at")[:50], many=True
    ).data)


@api_view(["GET"])
def list_documents(request):
    if USE_MONGO:
        from .mongo import list_documents
        return Response(list_documents())
    from .models import Document
    from .serializers import DocumentSerializer
    return Response(DocumentSerializer(
        Document.objects.order_by("-uploaded_at"), many=True
    ).data)
