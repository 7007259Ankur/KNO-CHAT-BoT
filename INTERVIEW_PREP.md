# KNO-BOT — Interview Preparation Guide
## Complete Architecture, Diagrams & Explanations

---

# 1. WHAT IS THIS PROJECT?

**KNO-BOT** is a production-ready **RAG (Retrieval-Augmented Generation) Chatbot** that lets users upload documents (PDF, DOCX, TXT) and have intelligent conversations with them.

- Every answer is **grounded in the uploaded documents** — no hallucinations
- Answers include **source citations** (file name + page number)
- Fully deployed on a **free cloud stack**: Netlify + Render + Qdrant + MongoDB Atlas

---

# 2. HIGH-LEVEL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                                  │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                    REACT FRONTEND (Netlify)                       │  │
│   │                                                                   │  │
│   │   ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐  │  │
│   │   │  Sidebar    │   │  ChatInterface   │   │  FileUpload     │  │  │
│   │   │  (history)  │   │  (messages UI)   │   │  (drag & drop)  │  │  │
│   │   └─────────────┘   └──────────────────┘   └─────────────────┘  │  │
│   │                           Background3D (Three.js particles)       │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                    │ HTTP/REST API calls                                  │
└────────────────────┼────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DJANGO BACKEND (Render)                               │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                  Django REST Framework                            │  │
│   │                                                                   │  │
│   │   POST /api/upload/    POST /api/chat/    GET /api/history/       │  │
│   │         │                    │                   │                │  │
│   │         ▼                    ▼                   ▼                │  │
│   │   upload_document()      chat()          chat_history()           │  │
│   │         │                    │                                    │  │
│   │         ▼                    ▼                                    │  │
│   │   ┌──────────────────────────────────────────────────────────┐   │  │
│   │   │                    rag.py (Core RAG Engine)               │   │  │
│   │   │   process_and_index()          ask_question()             │   │  │
│   │   └──────────────────────────────────────────────────────────┘   │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                    │                    │                                 │
└────────────────────┼────────────────────┼────────────────────────────────┘
                     │                    │
          ┌──────────┘                    └──────────────┐
          │                                              │
          ▼                                              ▼
┌──────────────────────┐                    ┌───────────────────────────┐
│   QDRANT CLOUD       │                    │   GROQ API                │
│   (Vector Store)     │                    │   LLaMA 3.1 8B Instant    │
│                      │                    │                           │
│  Stores 384-dim      │                    │  Generates final answer   │
│  embeddings of       │                    │  from context + question  │
│  document chunks     │                    │                           │
└──────────────────────┘                    └───────────────────────────┘
          ▲
          │ embed via
┌──────────────────────┐
│   COHERE API         │
│   embed-english-     │
│   light-v3.0         │
│   (384 dimensions)   │
└──────────────────────┘

┌──────────────────────┐
│   MONGODB ATLAS      │
│   (Persistence)      │
│                      │
│  - documents coll.   │
│  - chats coll.       │
└──────────────────────┘
```

---

# 3. RAG PIPELINE — DOCUMENT UPLOAD FLOW

```
User uploads file (PDF / DOCX / TXT)
            │
            ▼
┌─────────────────────────┐
│  POST /api/upload/       │
│  views.upload_document() │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│  File saved to disk      │
│  media/docs/<filename>   │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                  rag.process_and_index()                  │
│                                                          │
│  Step 1: Load Document                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  .pdf  → PyPDFLoader                             │   │
│  │  .docx → Docx2txtLoader                          │   │
│  │  .txt  → TextLoader                              │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          ▼                               │
│  Step 2: Split into Chunks                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  RecursiveCharacterTextSplitter                  │   │
│  │  chunk_size = 800 characters                     │   │
│  │  chunk_overlap = 100 characters                  │   │
│  │                                                  │   │
│  │  "Hello world this is a long document..."        │   │
│  │   ├── Chunk 1: [0:800]                           │   │
│  │   ├── Chunk 2: [700:1500]  ← 100 char overlap    │   │
│  │   └── Chunk 3: [1400:2200] ← 100 char overlap    │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          ▼                               │
│  Step 3: Generate Embeddings (Cohere API)                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Each chunk → 384-dimensional float vector       │   │
│  │  "The revenue grew by 20%..." → [0.12, -0.34...] │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          ▼                               │
│  Step 4: Store in Qdrant (batches of 10)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Collection: "rag_documents"                     │   │
│  │  Vector size: 384, Distance: COSINE              │   │
│  │  Stored with metadata: {source, page}            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│  Save metadata to DB     │
│  MongoDB: documents coll │
│  OR SQLite: Document ORM │
└─────────────────────────┘
            │
            ▼
  Return: { chunk_count, message }
```

---

# 4. RAG PIPELINE — CHAT / QUESTION ANSWERING FLOW

```
User types: "What was the revenue in Q3?"
            │
            ▼
┌─────────────────────────┐
│  POST /api/chat/         │
│  views.chat()            │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                   rag.ask_question()                      │
│                                                          │
│  Step 1: Embed the Query (Cohere)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  "What was the revenue in Q3?"                   │   │
│  │              ↓                                   │   │
│  │  [0.23, -0.11, 0.87, ...] (384 dims)             │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          ▼                               │
│  Step 2: Semantic Search in Qdrant (k=6)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Cosine similarity search across all chunks      │   │
│  │  Returns top 6 most relevant document chunks     │   │
│  │                                                  │   │
│  │  Result: [chunk_A, chunk_B, chunk_C, ...]        │   │
│  │  Each chunk has: page_content + metadata         │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          ▼                               │
│  Step 3: Build Context String                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  context = chunk_A.text + "\n\n" + chunk_B.text  │   │
│  │           + "\n\n" + chunk_C.text + ...          │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          ▼                               │
│  Step 4: Build Prompt                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PROMPT_TEMPLATE:                                │   │
│  │  "You are a helpful assistant...                 │   │
│  │   Context: {context}                             │   │
│  │   Question: {question}                           │   │
│  │   Provide a clear, detailed answer..."           │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          ▼                               │
│  Step 5: LLM Call (Groq — LLaMA 3.1 8B)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  LangChain chain: prompt | llm | StrOutputParser │   │
│  │  temperature = 0.2 (focused, factual answers)    │   │
│  │  Returns: answer string                          │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          ▼                               │
│  Step 6: Extract Sources                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  For each retrieved chunk:                       │   │
│  │  source = metadata["source"] → filename         │   │
│  │  page   = metadata["page"]   → page number      │   │
│  │  → "report.pdf (page 3)"                        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│  Save to MongoDB/SQLite  │
│  { question, answer,     │
│    sources, created_at } │
└─────────────────────────┘
            │
            ▼
  Return: { answer, sources }
```

---

# 5. DATABASE ARCHITECTURE — DUAL DB STRATEGY

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE STRATEGY                             │
│                                                                  │
│  Environment variable MONGODB_URI controls which DB is used:    │
│                                                                  │
│  if MONGODB_URI is set → USE MONGODB ATLAS                       │
│  else                  → USE SQLITE (local/dev)                  │
└─────────────────────────────────────────────────────────────────┘

SQLITE (Django ORM)                    MONGODB ATLAS (pymongo)
─────────────────────                  ──────────────────────────
Used in: development                   Used in: production

Table: chatbot_document                Collection: documents
┌──────────────────────┐               ┌──────────────────────────┐
│ id (PK)              │               │ _id (ObjectId)           │
│ file (FileField)     │               │ original_name (str)      │
│ original_name (str)  │               │ file_path (str)          │
│ uploaded_at (dt)     │               │ chunk_count (int)        │
│ processed (bool)     │               │ uploaded_at (datetime)   │
└──────────────────────┘               └──────────────────────────┘

Table: chatbot_chatmessage             Collection: chats
┌──────────────────────┐               ┌──────────────────────────┐
│ id (PK)              │               │ _id (ObjectId)           │
│ question (text)      │               │ question (str)           │
│ answer (text)        │               │ answer (str)             │
│ sources (JSON)       │               │ sources (array)          │
│ created_at (dt)      │               │ created_at (datetime)    │
└──────────────────────┘               └──────────────────────────┘

NOTE: Qdrant is a THIRD separate store — only for vectors.
      It stores embeddings, NOT the raw text or chat history.
```

---

# 6. FRONTEND COMPONENT TREE

```
App.tsx (root state manager)
│
│  State:
│  ├── messages: Message[]
│  ├── isTyping: boolean
│  └── activeTab: 'chat' | 'knowledge'
│
│  Handlers:
│  ├── handleSendMessage() → POST /api/chat/
│  └── handleFileUpload()  → POST /api/upload/
│
├── Background3D.tsx
│   └── Three.js particle animation (purely visual)
│
├── Sidebar.tsx
│   └── Chat history, new chat button
│
└── main content area
    ├── ChatInterface.tsx
    │   ├── Props: messages, onSendMessage, isTyping
    │   ├── Message list (AnimatePresence + motion.div)
    │   ├── Typing indicator (3 animated dots)
    │   └── Input form (text + send button)
    │
    └── Knowledge Panel (inline in App.tsx)
        └── FileUpload.tsx
            ├── Props: onUpload
            ├── Drag & drop zone
            ├── File input (hidden)
            └── File list with progress bars
```

---

# 7. API ENDPOINTS MAP

```
BASE URL: https://rag-chatbot-api-dzum.onrender.com

┌──────────────────────────────────────────────────────────────────┐
│  METHOD  │  ENDPOINT          │  DESCRIPTION                     │
├──────────┼────────────────────┼──────────────────────────────────┤
│  POST    │  /api/upload/      │  Upload & index a document       │
│          │                    │  Body: multipart/form-data        │
│          │                    │  Field: file (PDF/DOCX/TXT)       │
│          │                    │  Returns: { message, document }   │
├──────────┼────────────────────┼──────────────────────────────────┤
│  POST    │  /api/chat/        │  Ask a question (RAG)            │
│          │                    │  Body: { "query": "..." }         │
│          │                    │  Returns: { answer, sources }     │
├──────────┼────────────────────┼──────────────────────────────────┤
│  GET     │  /api/history/     │  Get last 50 chat messages       │
│          │                    │  Returns: [ { question, answer,  │
│          │                    │              sources, created_at }│
├──────────┼────────────────────┼──────────────────────────────────┤
│  GET     │  /api/documents/   │  List all uploaded documents     │
│          │                    │  Returns: [ { original_name,     │
│          │                    │              uploaded_at, ... } ] │
└──────────┴────────────────────┴──────────────────────────────────┘
```

---

# 8. TECH STACK BREAKDOWN

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER          │  TECHNOLOGY              │  PURPOSE           │
├─────────────────┼──────────────────────────┼────────────────────┤
│  Frontend       │  React 19 + TypeScript   │  UI framework      │
│                 │  Vite                    │  Build tool        │
│                 │  Tailwind CSS v4         │  Styling           │
│                 │  Framer Motion           │  Animations        │
│                 │  Three.js                │  3D background     │
│                 │  Lucide React            │  Icons             │
├─────────────────┼──────────────────────────┼────────────────────┤
│  Backend        │  Django 6                │  Web framework     │
│                 │  Django REST Framework   │  API layer         │
│                 │  django-cors-headers     │  CORS handling     │
│                 │  whitenoise              │  Static files      │
│                 │  gunicorn                │  WSGI server       │
├─────────────────┼──────────────────────────┼────────────────────┤
│  RAG Pipeline   │  LangChain               │  Orchestration     │
│                 │  Cohere Embeddings       │  Text → vectors    │
│                 │  Qdrant                  │  Vector search     │
│                 │  Groq (LLaMA 3.1 8B)    │  LLM inference     │
├─────────────────┼──────────────────────────┼────────────────────┤
│  File Parsing   │  PyPDF                   │  PDF loading       │
│                 │  python-docx             │  DOCX loading      │
│                 │  LangChain TextLoader    │  TXT loading       │
├─────────────────┼──────────────────────────┼────────────────────┤
│  Databases      │  SQLite                  │  Dev/ORM           │
│                 │  MongoDB Atlas           │  Prod persistence  │
│                 │  Qdrant Cloud            │  Vector store      │
├─────────────────┼──────────────────────────┼────────────────────┤
│  Deployment     │  Netlify                 │  Frontend hosting  │
│                 │  Render                  │  Backend hosting   │
└─────────────────┴──────────────────────────┴────────────────────┘
```

---

# 9. WHAT IS RAG? (Explain Simply)

```
TRADITIONAL LLM:
  Question → LLM (trained knowledge only) → Answer
  Problem: LLM doesn't know YOUR documents. Can hallucinate.

RAG (Retrieval-Augmented Generation):
  Question → Search YOUR docs → Get relevant chunks
           → Inject chunks into prompt → LLM → Grounded Answer

  It's like giving the LLM an "open book exam" instead of
  asking it to recall everything from memory.

WHY IT MATTERS:
  ✓ Answers are based on actual document content
  ✓ Source citations prove where the answer came from
  ✓ Works with any document — no retraining needed
  ✓ Reduces hallucinations dramatically
```

---

# 10. VECTOR EMBEDDINGS — EXPLAINED

```
TEXT → NUMBERS (Embeddings)

"The company revenue grew 20% in Q3"
              ↓  Cohere embed-english-light-v3.0
[0.12, -0.34, 0.87, 0.02, -0.91, ... ] (384 numbers)

WHY?
  Computers can't compare text directly.
  But they CAN compare vectors using math (cosine similarity).

COSINE SIMILARITY:
  Similar meaning → vectors point in same direction → score near 1.0
  Different meaning → vectors point away → score near 0.0

  "revenue Q3"  vs  "Q3 earnings"     → similarity: 0.92 ✓ (retrieved)
  "revenue Q3"  vs  "employee policy" → similarity: 0.11 ✗ (skipped)

QDRANT stores all these vectors and finds the top-k most similar
ones to the query vector in milliseconds.
```

---

# 11. DEPLOYMENT ARCHITECTURE

```
                    INTERNET
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
  kno-bot.netlify.app    rag-chatbot-api-dzum.onrender.com
  ┌─────────────────┐    ┌──────────────────────────────┐
  │   NETLIFY CDN   │    │   RENDER (Free Tier)         │
  │                 │    │                              │
  │  React SPA      │    │  gunicorn + Django           │
  │  (static files) │    │  Python 3.12                 │
  │                 │    │                              │
  │  netlify.toml   │    │  render.yaml                 │
  │  - redirects    │    │  - build: pip install        │
  │    /* → /index  │    │  - start: gunicorn wsgi      │
  └─────────────────┘    └──────────────────────────────┘
          │                         │
          │  /api/* proxied to →    │
          └────────────────────────►│
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
             Qdrant Cloud    MongoDB Atlas     Cohere API
             (vectors)       (chat history)   (embeddings)
                                    │
                                    ▼
                               Groq API
                             (LLM inference)
```

---

# 12. DATA FLOW — END TO END (One Question)

```
1. User types "What is the main conclusion?" in browser
   │
2. React App.tsx → handleSendMessage() called
   │  → adds user message to state (instant UI update)
   │  → sets isTyping = true (shows 3 dots)
   │
3. fetch('POST /api/chat/', { query: "What is the main conclusion?" })
   │
4. Django views.chat() receives request
   │  → validates query is not empty
   │
5. rag.ask_question("What is the main conclusion?") called
   │
6. Cohere API called → query embedded to 384-dim vector
   │
7. Qdrant searched → top 6 chunks returned
   │  (cosine similarity, most relevant passages)
   │
8. Context string built from 6 chunks
   │
9. Prompt assembled: system instructions + context + question
   │
10. Groq API called (LLaMA 3.1 8B, temp=0.2)
    │  → streams back answer text
    │
11. Sources extracted from chunk metadata
    │  → ["report.pdf (page 2)", "report.pdf (page 7)"]
    │
12. MongoDB: save_chat() stores question + answer + sources
    │
13. Response JSON returned to frontend:
    │  { answer: "The main conclusion is...", sources: [...] }
    │
14. React: isTyping = false, AI message added to state
    │  → UI renders answer with sources
    │
Total time: ~1-2 seconds
```

---

# 13. KEY DESIGN DECISIONS (Interview Questions)

## Q: Why Qdrant instead of FAISS?
```
FAISS: In-memory, local only, lost on server restart
Qdrant Cloud: Persistent, cloud-hosted, free tier available,
              production-ready with REST API
→ Better for deployment on Render (ephemeral filesystem)
```

## Q: Why Groq instead of OpenAI?
```
Groq uses custom LPU (Language Processing Unit) hardware
→ LLaMA 3.1 8B responses in ~0.5 seconds vs ~2-3s on OpenAI
→ Free tier is generous for demos
→ Open-source model (LLaMA) = no vendor lock-in
```

## Q: Why Cohere for embeddings?
```
embed-english-light-v3.0 = 384 dimensions
→ Smaller than OpenAI's 1536-dim = faster + cheaper
→ Still high quality for English documents
→ Free tier available
```

## Q: Why chunk_overlap=100?
```
Prevents losing context at chunk boundaries.
If a sentence spans two chunks, overlap ensures
both chunks contain enough context to be useful.
```

## Q: Why temperature=0.2 for the LLM?
```
Lower temperature = more deterministic, factual answers
Higher temperature = more creative but less accurate
For document Q&A, we want precision over creativity.
```

## Q: Why dual database (SQLite + MongoDB)?
```
SQLite: Zero config, works locally for development
MongoDB Atlas: Free cloud tier, flexible schema (JSON),
               good for storing variable-length chat data
The code checks MONGODB_URI env var to switch automatically.
```

## Q: Why batch_size=10 when adding to Qdrant?
```
Qdrant Cloud free tier has request size limits.
Batching prevents timeout errors on large documents.
```

---

# 14. SECURITY & CORS CONFIGURATION

```
CORS (Cross-Origin Resource Sharing):
  Development: CORS_ALLOW_ALL_ORIGINS = True (any origin)
  Production:  Whitelist only:
               - http://localhost:5173 (Vite dev)
               - https://kno-bot.netlify.app (prod frontend)
               - https://rag-chatbot-api-dzum.onrender.com

File Upload Security:
  - Allowed extensions: .pdf, .docx, .txt only
  - Validated in views.py before processing
  - Files saved to media/docs/ (not served directly)

API Keys:
  - All stored in .env file (never committed to git)
  - Loaded via python-dotenv at startup
  - .env.example provided as template
```

---

# 15. LANGCHAIN CHAIN PATTERN

```python
# This is the core LangChain pattern used in rag.py

prompt = PromptTemplate(
    template=PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.2)

# LCEL (LangChain Expression Language) pipe syntax:
chain = prompt | llm | StrOutputParser()

# Execution:
answer = chain.invoke({
    "context": "...retrieved chunks...",
    "question": "What is the revenue?"
})

# Data flows left to right:
# PromptTemplate formats the string
#   → ChatGroq sends to Groq API, gets AIMessage back
#     → StrOutputParser extracts just the text string
```

---

# 16. QUICK SUMMARY FOR INTERVIEW

```
"I built a full-stack RAG chatbot called KNO-BOT.

The user uploads a document → the backend splits it into
800-character chunks → each chunk is converted to a 384-dim
vector using Cohere embeddings → stored in Qdrant vector DB.

When the user asks a question → the question is also embedded
→ Qdrant finds the 6 most semantically similar chunks →
those chunks are injected into a prompt → sent to Groq's
LLaMA 3.1 model → which generates a grounded answer with
source citations.

The frontend is React + TypeScript with a Three.js particle
background. The backend is Django REST Framework. Data is
persisted in MongoDB Atlas. Everything is deployed for free
on Netlify + Render + Qdrant Cloud + MongoDB Atlas."
```

---

*Good luck with your interview!*
