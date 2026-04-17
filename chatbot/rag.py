import os
from pathlib import Path

os.environ["USE_TF"] = "0"
os.environ["TRANSFORMERS_NO_TF"] = "1"

COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "rag_documents")

PROMPT_TEMPLATE = """You are a helpful assistant that answers questions based on the provided document context.
Be detailed and thorough in your answers. If the context contains relevant information, use it fully.
Only say you don't have enough information if the context truly has nothing related to the question.

Context:
{context}

Question: {question}

Provide a clear, detailed answer based on the context above:"""


def get_embeddings():
    # Cohere free tier — fast, reliable, no local model needed
    from langchain_community.embeddings import CohereEmbeddings
    return CohereEmbeddings(
        cohere_api_key=os.getenv("COHERE_API_KEY"),
        model="embed-english-light-v3.0",
    )


def get_qdrant():
    from langchain_qdrant import QdrantVectorStore
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams

    client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY"),
    )

    # Create collection if it doesn't exist
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
        )

    return QdrantVectorStore(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding=get_embeddings(),
    )


def get_loader(file_path: str):
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        from langchain_community.document_loaders import PyPDFLoader
        return PyPDFLoader(file_path)
    elif ext == ".docx":
        from langchain_community.document_loaders import Docx2txtLoader
        return Docx2txtLoader(file_path)
    else:
        from langchain_community.document_loaders import TextLoader
        return TextLoader(file_path)


def process_and_index(file_path: str) -> int:
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    loader = get_loader(file_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_documents(docs)

    store = get_qdrant()
    # Add in small batches to avoid timeout
    batch_size = 10
    for i in range(0, len(chunks), batch_size):
        store.add_documents(chunks[i:i+batch_size])

    return len(chunks)


def ask_question(query: str) -> dict:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import PromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    store = get_qdrant()
    retriever = store.as_retriever(search_kwargs={"k": 6})

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        api_key=os.getenv("GROQ_API_KEY"),
    )

    prompt = PromptTemplate(template=PROMPT_TEMPLATE, input_variables=["context", "question"])

    retrieved_docs = retriever.invoke(query)

    if not retrieved_docs:
        return {"answer": "No documents have been uploaded yet.", "sources": []}

    context = "\n\n".join(doc.page_content for doc in retrieved_docs)
    chain = prompt | llm | StrOutputParser()
    answer = chain.invoke({"context": context, "question": query})

    sources = []
    for doc in retrieved_docs:
        source = doc.metadata.get("source", "")
        page = doc.metadata.get("page", "")
        entry = Path(source).name if source else "unknown"
        if page != "":
            entry += f" (page {page + 1})"
        if entry not in sources:
            sources.append(entry)

    return {"answer": answer, "sources": sources}
