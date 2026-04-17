import os
from datetime import datetime
from pymongo import MongoClient

_client = None

def get_db():
    global _client
    if _client is None:
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise ValueError("MONGODB_URI not set in environment")
        _client = MongoClient(uri)
    return _client["rag_chatbot"]


def save_document(original_name: str, file_path: str, chunk_count: int) -> str:
    db = get_db()
    result = db["documents"].insert_one({
        "original_name": original_name,
        "file_path": file_path,
        "chunk_count": chunk_count,
        "uploaded_at": datetime.utcnow(),
    })
    return str(result.inserted_id)


def list_documents():
    db = get_db()
    docs = list(db["documents"].find({}, {"_id": 1, "original_name": 1, "chunk_count": 1, "uploaded_at": 1}))
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d["uploaded_at"] = d["uploaded_at"].isoformat()
    return docs


def save_chat(question: str, answer: str, sources: list) -> dict:
    db = get_db()
    result = db["chats"].insert_one({
        "question": question,
        "answer": answer,
        "sources": sources,
        "created_at": datetime.utcnow(),
    })
    return {
        "id": str(result.inserted_id),
        "question": question,
        "answer": answer,
        "sources": sources,
    }


def list_chats(limit: int = 50):
    db = get_db()
    chats = list(db["chats"].find({}).sort("created_at", -1).limit(limit))
    for c in chats:
        c["id"] = str(c.pop("_id"))
        c["created_at"] = c["created_at"].isoformat()
    return chats
