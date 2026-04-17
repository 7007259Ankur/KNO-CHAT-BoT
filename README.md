<div align="center">

# 🧠 KNO-BOT

### *Chat with your documents. Instantly. Intelligently.*

> Upload any PDF, DOCX, or TXT — and have a real conversation with it powered by Groq's blazing-fast LLaMA 3.1 and semantic vector search.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-kno--bot.netlify.app-00f2ff?style=for-the-badge&logo=netlify&logoColor=white)](https://kno-bot.netlify.app)
[![Backend](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://rag-chatbot-api-dzum.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-bc13fe?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

</div>

---

<div align="center">

![KNO-BOT Demo](https://placehold.co/900x500/0a0a12/00f2ff?text=KNO-BOT+%E2%80%94+Chat+with+your+Documents)

*Upload a document. Ask anything. Get cited answers in seconds.*

</div>

---

## 🚀 About The Project

**KNO-BOT** is a production-ready RAG (Retrieval-Augmented Generation) chatbot that lets you upload documents and have intelligent conversations with them. No hallucinations — every answer is grounded in your actual content with source citations.

Built for developers, researchers, and teams who are tired of manually searching through PDFs. Drop in a document, ask a question, get a precise answer with the exact page it came from.

Deployed on a fully free cloud stack — Netlify + Render + Qdrant + MongoDB Atlas.

---

## ✨ Key Features

- 🔍 **Semantic Search** — Cohere embeddings + Qdrant vector DB for accurate context retrieval
- ⚡ **Blazing Fast Answers** — Groq's LLaMA 3.1 delivers responses in under 2 seconds
- 📄 **Multi-Format Support** — Upload PDF, DOCX, and TXT files
- 📌 **Source Citations** — Every answer shows exactly which document and page it came from
- 🌐 **Fully Cloud-Native** — Zero local dependencies, runs entirely on free cloud services
- 💬 **Chat History** — All conversations persisted in MongoDB Atlas
- 🎨 **Stunning UI** — Dark glassmorphism design with Three.js particle background

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **3D / Animation** | Three.js, Framer Motion |
| **Backend** | Django 6, Django REST Framework |
| **LLM** | Groq — LLaMA 3.1 8B Instant |
| **Embeddings** | Cohere `embed-english-light-v3.0` |
| **Vector Store** | Qdrant Cloud |
| **Database** | MongoDB Atlas |
| **File Parsing** | LangChain, PyPDF, python-docx |
| **Hosting** | Netlify (frontend) + Render (backend) |

---

## 📁 Project Structure

```
KNO-CHAT-BoT/
├── manage.py
├── requirements.txt
├── render.yaml                  # Render deployment config
├── .env.example
│
├── rag_chatbot/                 # Django project
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── chatbot/                     # Django app
│   ├── models.py                # Document & ChatMessage models
│   ├── views.py                 # API endpoints
│   ├── urls.py
│   ├── serializers.py
│   ├── rag.py                   # Core RAG pipeline
│   └── mongo.py                 # MongoDB client
│
└── frontend/                    # React app
    ├── netlify.toml             # Netlify deployment config
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css
        ├── types.ts
        └── components/
            ├── ChatInterface.tsx
            ├── FileUpload.tsx
            ├── Sidebar.tsx
            └── Background3D.tsx
```

---

## 🏁 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Free accounts on: [Groq](https://console.groq.com), [Cohere](https://dashboard.cohere.com), [HuggingFace](https://huggingface.co), [Qdrant Cloud](https://cloud.qdrant.io), [MongoDB Atlas](https://cloud.mongodb.com)

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/7007259Ankur/KNO-CHAT-BoT.git
cd KNO-CHAT-BoT
```

**2. Set up the backend**
```bash
pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys in .env
python manage.py migrate
python manage.py runserver
```

**3. Set up the frontend**
```bash
cd frontend
npm install
npx vite
```

Open `http://localhost:3004`

---

### 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# LLM
GROQ_API_KEY=your-groq-api-key

# Embeddings
COHERE_API_KEY=your-cohere-api-key
HF_API_KEY=your-huggingface-token

# Vector Store
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION=rag_documents

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/rag_chatbot

# Django
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
```

---

## 📡 API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/` | Upload and index a document |
| `POST` | `/api/chat/` | Ask a question, get RAG answer |
| `GET` | `/api/documents/` | List all uploaded documents |
| `GET` | `/api/history/` | Get chat history |

**Example — Chat request:**
```bash
curl -X POST https://rag-chatbot-api-dzum.onrender.com/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the main topic of the document?"}'
```

**Response:**
```json
{
  "answer": "The document covers...",
  "sources": ["report.pdf (page 2)", "report.pdf (page 5)"]
}
```

---

## 🗺 Roadmap

- [x] PDF, DOCX, TXT upload and indexing
- [x] RAG pipeline with source citations
- [x] Persistent chat history in MongoDB
- [x] Production deployment on Render + Netlify
- [ ] User authentication and per-user knowledge bases
- [ ] Streaming responses (like ChatGPT)
- [ ] Support for web URL ingestion
- [ ] Multi-language document support
- [ ] Mobile-responsive UI improvements

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "add: your feature"
git push origin feature/your-feature
# Open a Pull Request
```

Please keep PRs focused and include a clear description of what changed and why.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Ankur Kumar**

[![GitHub](https://img.shields.io/badge/GitHub-7007259Ankur-181717?style=flat&logo=github)](https://github.com/7007259Ankur)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/your-profile)
[![Email](https://img.shields.io/badge/Email-ankur%40example.com-EA4335?style=flat&logo=gmail)](mailto:ankur@example.com)

---

## 🙏 Acknowledgements

- [LangChain](https://langchain.com) — RAG pipeline orchestration
- [Groq](https://groq.com) — Ultra-fast LLM inference
- [Qdrant](https://qdrant.tech) — Vector similarity search
- [Cohere](https://cohere.com) — Production-grade embeddings
- [MongoDB Atlas](https://mongodb.com/atlas) — Cloud database
- [Three.js](https://threejs.org) — 3D particle background

---

<div align="center">

**⭐ Star this repo if you found it useful!**

*Built with ❤️ by Ankur Kumar*

</div>
