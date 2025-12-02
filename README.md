# 🛡️ Phishing Email Detection System

An AI/ML-powered phishing email detection system that uses machine learning to detect spam and phishing emails with high accuracy. Built with FastAPI backend and Next.js frontend, containerized with Docker for easy deployment.

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🤖 Machine Learning
- **AI-Powered Detection**: Uses TF-IDF vectorization and Logistic Regression for spam classification
- **High Accuracy**: Trained on comprehensive email datasets
- **Real-time Analysis**: Instant email threat assessment
- **Confidence Scoring**: Provides probability scores for both spam and legitimate emails

### 📧 Email Analysis
- **Subject & Body Analysis**: Analyzes complete email content
- **Attachment Support**: Handles multiple file attachments with metadata extraction
- **Batch Processing**: Supports analysis of emails with multiple attachments
- **Detailed Results**: Returns prediction, confidence, and probability metrics

### 🎨 Modern UI
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Feedback**: Loading states and progress indicators
- **Visual Analytics**: Color-coded threat indicators and confidence meters
- **Drag & Drop**: Easy file upload with drag-and-drop support

### 🐳 DevOps Ready
- **Docker Containerized**: Complete Docker setup for both frontend and backend
- **Multi-stage Builds**: Optimized Docker images for production
- **Health Checks**: Built-in health monitoring for services
- **Auto-restart**: Configured for automatic recovery on failures

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│                  (http://localhost:3000)                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌────────────────────────▼────────────────────────────────┐
│              Next.js Frontend Container                  │
│                    (Port 3000)                           │
│  • Server-side rendering                                 │
│  • API proxy /api/* → backend                            │
│  • React components with TypeScript                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Internal Network (app-network)
                         │ /api/* → http://backend:5000/*
                         │
┌────────────────────────▼────────────────────────────────┐
│              FastAPI Backend Container                   │
│                    (Port 5000)                           │
│  • ML Model serving                                      │
│  • TF-IDF Vectorizer                                     │
│  • Logistic Regression Classifier                        │
│  • File upload handling                                  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- FastAPI 0.109+ (Python web framework)
- Scikit-learn 1.4+ (Machine learning)
- Joblib (Model serialization)
- Uvicorn (ASGI server)
- Python 3.12

**Frontend:**
- Next.js 16.0 (React framework)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
- Radix UI (Component library)
- Lucide React (Icons)

**Infrastructure:**
- Docker & Docker Compose
- Node.js 22 Alpine
- Python 3.12 Slim
- Multi-stage builds

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: 20.10 or higher ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: 2.0 or higher (Usually included with Docker Desktop)
- **Git**: For cloning the repository

Optional (for local development without Docker):
- **Python**: 3.12 or higher
- **Node.js**: 22 or higher
- **npm** or **yarn**: Package manager

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/AayushRajthala99/phishing-email-detection-system.git
   cd phishing-email-detection-system
   ```

2. **Start the application**
   ```bash
   docker compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

4. **Stop the application**
   ```bash
   docker compose down --remove-orphans
   ```

### Local Development Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## 📁 Project Structure

```
phishing-email-detection-system/
├── backend/
│   ├── models/
│   │   ├── spam_classifier_model.pkl    # Trained ML model
│   │   └── tfidf_vectorizer.pkl         # TF-IDF vectorizer
│   ├── app.py                           # FastAPI application
│   ├── requirements.txt                 # Python dependencies
│   ├── Dockerfile                       # Backend Docker config
│   └── .dockerignore                    # Docker ignore patterns
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                     # Main page component
│   │   └── layout.tsx                   # Root layout
│   ├── components/
│   │   └── ui/                          # Reusable UI components
│   ├── lib/
│   │   └── utils.ts                     # Utility functions
│   ├── public/                          # Static assets
│   ├── next.config.ts                   # Next.js configuration
│   ├── package.json                     # Node dependencies
│   ├── Dockerfile                       # Frontend Docker config
│   ├── .dockerignore                    # Docker ignore patterns
│   └── .env.example                     # Environment variables template
│
├── docker-compose.yml                   # Docker orchestration
├── swagger.yml                          # API documentation
├── README.md                            # This file
└── LICENSE                              # License information
```

## 📚 API Documentation

### Base URL
- **Local**: http://localhost:5000
- **Docker**: http://backend:5000 (internal network)

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": true,
  "error": null
}
```

#### 2. Predict Email
```http
POST /predict
Content-Type: multipart/form-data
```

**Request Body:**
- `subject` (string, required): Email subject
- `body` (string, required): Email body content
- `files` (file[], optional): Email attachments

**Response:**
```json
{
  "prediction": "spam",
  "confidence": 0.9234,
  "spam_probability": 0.9234,
  "ham_probability": 0.0766,
  "attachments_info": [
    {
      "filename": "invoice.pdf",
      "content_type": "application/pdf",
      "sha256sum": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "size": 45678,
      "malicious": 0.7643,
      "category": ["trojan","phishing", "ransomware"]
    }
  ]
}
```

### Interactive API Documentation

FastAPI provides interactive API documentation:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

For detailed API specifications, see [swagger.yml](./swagger.yml)

## ⚙️ Configuration

### Environment Variables

#### Frontend (.env.local)
```env
# API Configuration (handled by Next.js rewrites in production)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Backend
No environment variables required. Configuration is handled through code.

### Docker Configuration

**Memory Limits:**
- Backend: 2GB limit, 512MB reservation
- Frontend: Default Docker limits

**Port Mapping:**
- Frontend: `3000:3000`
- Backend: `5000:5000`

### Next.js Configuration

API proxying is configured in `frontend/next.config.ts`:
```typescript
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: "http://backend:5000/:path*",
    },
  ];
}
```

## 🚢 Deployment

### Docker Production Deployment

1. **Build production images**
   ```bash
   docker compose build --no-cache
   ```

2. **Run in detached mode**
   ```bash
   docker compose up --build -d
   ```

3. **View logs**
   ```bash
   docker compose logs -f
   ```

4. **Scale services** (if needed)
   ```bash
   docker compose up -d --scale backend=3
   ```

## 🔒 Security Considerations
- **CORS**: Currently allows all origins (`*`) - restrict in production
- **File Upload**: 50MB limit per file - adjust based on requirements

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend development
- Write tests for new features
- Update documentation as needed
- Ensure Docker builds pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Aayush Rajthala** - [AayushRajthala99](https://github.com/AayushRajthala99)
- **Rabin Patel** - [Robinpats182](https://github.com/robinpats182)
- **Samsuhang Nembang** - [Hangsam](https://github.com/hangsam)

---

**Made with ❤️ using FastAPI, Next.js, and Machine Learning**