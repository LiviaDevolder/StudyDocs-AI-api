# StudyDocs AI API

A powerful RAG (Retrieval-Augmented Generation) API for document processing and intelligent question answering. Built with NestJS, GraphQL, PostgreSQL, and Google Cloud Platform.

## 🚀 Features

- **Document Upload & Processing**: Async document processing with Bull Queue
- **OCR Integration**: High-quality text extraction using Docling OCR with automatic fallback to local libraries
- **Intelligent Chunking**: Smart text segmentation preserving semantic boundaries
- **Vector Embeddings**: Generate 768-dimensional embeddings using Google Vertex AI
- **Semantic Search**: Query documents using vector similarity search
- **GraphQL API**: Type-safe API with real-time progress tracking
- **Multi-format Support**: PDF, DOCX, TXT, MD, and images
- **Scalable Architecture**: Bull Queue with Redis for background job processing

## 📋 Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **PostgreSQL** 17+ with pgvector extension
- **Redis** 6+ (for job queue)
- **Docker** (optional, recommended for Redis)
- **Google Cloud Platform** account with:
  - Cloud Storage bucket
  - Vertex AI API enabled
  - Service Account with appropriate permissions

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd StudyDocs-AI-api
```

### 2. Install Dependencies

```bash
bun install
# or
npm install
```

### 3. Set Up PostgreSQL

#### Option A: Docker

```bash
docker run -d \
  --name postgres-studydocs \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=studydocs \
  -p 5432:5432 \
  postgres:17-alpine
```

#### Option B: Local Installation

```bash
# macOS
brew install postgresql@17
brew services start postgresql@17

# Create database
createdb studydocs
```

#### Install pgvector Extension

```sql
-- Connect to your database
psql -U postgres -d studydocs

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Set Up Redis

Redis is **required** for the Bull Queue job processing system.

#### Option A: Docker (Recommended)

```bash
docker run -d \
  --name redis-studydocs \
  -p 6379:6379 \
  redis:alpine
```

#### Option B: Local Installation

```bash
# macOS
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 5. Configure Google Cloud Platform

#### Create Service Account

1. Go to [GCP Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Click **Create Service Account**
4. Grant the following roles:
   - Storage Admin (for Cloud Storage)
   - Vertex AI User (for embeddings)
5. Create and download JSON key
6. Save the key file in the project root (e.g., `service-account.json`)

#### Create Cloud Storage Bucket

```bash
# Using gcloud CLI
gcloud storage buckets create gs://your-bucket-name \
  --location=us-central1 \
  --uniform-bucket-level-access
```

#### Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com
```

### 6. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=studydocs

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN=7d

# Google Cloud Storage
GCS_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_KEY_FILENAME=./service-account.json

# Vertex AI (for embeddings)
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_API_KEY=your-vertex-ai-api-key
VERTEX_AI_EMBEDDING_MODEL=text-embedding-004
VERTEX_AI_EMBEDDING_DIMENSION=768

# Redis (required for Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Docling OCR Service (optional - for enhanced OCR capabilities)
DOCLING_OCR_URL=your-docling-ocr-url
DOCLING_OCR_API_KEY=

# Processing Configuration
PROCESSING_BATCH_SIZE=5
PROCESSING_CONCURRENCY=2
```

### 7. Run Database Migrations

```bash
bun run migration:run
# or
npm run migration:run
```

## 🚀 Running the Application

### Development Mode

```bash
bun run start:dev
# or
npm run start:dev
```

The API will be available at `http://localhost:3000`

GraphQL Playground: `http://localhost:3000/graphql`

### Production Mode

```bash
# Build
bun run build
# or
npm run build

# Start
bun run start:prod
# or
npm run start:prod
```

## 📚 API Usage

### Authentication

First, create a user and login to get an access token:

```graphql
# Register
mutation {
  register(
    email: "user@example.com"
    password: "your-password"
    name: "John Doe"
  ) {
    id
    email
    name
  }
}

# Login
mutation {
  login(email: "user@example.com", password: "your-password") {
    access_token
    user {
      id
      email
    }
  }
}
```

Add the token to your requests:

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

### Create a Project

```graphql
mutation {
  createProject(createProjectInput: { name: "My Study Project" }) {
    id
    name
    createdAt
  }
}
```

### Upload a Document

```graphql
mutation UploadDocument($projectId: ID!, $file: Upload!) {
  uploadDocument(projectId: $projectId, file: $file) {
    id
    name
    type
    fileSize
    status
    gcsPath
    createdAt
  }
}
```

**Variables:**

```json
{
  "projectId": "your-project-id",
  "file": null
}
```

The file upload will be handled through the GraphQL multipart request. The document will be:

1. ✅ Uploaded to Google Cloud Storage
2. ✅ Queued for async processing
3. ✅ Text extracted using Docling OCR (with fallback to local libraries)
4. ✅ Chunked into semantic segments
5. ✅ Embeddings generated using Vertex AI
6. ✅ Stored in PostgreSQL with vector search enabled

### Monitor Processing Progress

```graphql
query {
  documentProcessingJobs {
    id
    documentId
    type
    status
    progress
    currentStep
    totalChunks
    processedChunks
    errorMessage
    startedAt
    completedAt
  }
}
```

### View Processed Document

```graphql
query GetDocument($id: ID!) {
  document(id: $id) {
    id
    name
    status
    fileSize
    type
    chunks {
      id
      content
      embedding
      metadata
    }
  }
}
```

## 🏗️ Architecture

### Technology Stack

- **Framework**: NestJS 11
- **API**: GraphQL with Apollo Server
- **Database**: PostgreSQL with pgvector
- **ORM**: TypeORM
- **Job Queue**: Bull with Redis
- **Storage**: Google Cloud Storage
- **AI/ML**: Google Vertex AI (text-embedding-004)
- **OCR**: Docling OCR with fallback to pdf-parse, mammoth

### Document Processing Pipeline

```
Upload Request
    ↓
GCS Upload
    ↓
Save Metadata (status: PENDING)
    ↓
Create Job & Add to Bull Queue
    ↓
[Background Processing]
    ├─ Download from GCS
    ├─ Extract Text (Docling OCR → pdf-parse → mammoth → plain-text)
    ├─ Smart Chunking (1000 chars, 200 overlap)
    ├─ Generate Embeddings (Vertex AI, batch of 5)
    ├─ Save Chunks with Vectors
    └─ Update Status (PROCESSED)
    ↓
Ready for Semantic Search
```

### Job Queue Features

- **Retry Logic**: Up to 3 attempts with exponential backoff
- **Progress Tracking**: Real-time progress updates (0-100%)
- **Concurrency Control**: Configurable concurrent job processing
- **Error Handling**: Detailed error logging and stack traces
- **Job Persistence**: Failed jobs kept for debugging

## 🧪 Testing

### Run Unit Tests

```bash
bun run test
# or
npm run test
```

### Run E2E Tests

```bash
bun run test:e2e
# or
npm run test:e2e
```

### Test Document Upload

## 📊 Monitoring

### Check Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### View Queue Statistics

```graphql
query {
  queueStats {
    waiting
    active
    completed
    failed
    delayed
    total
  }
}
```

### Application Logs

The application provides detailed logging for:

- Document upload progress
- OCR extraction status
- Chunking operations
- Embedding generation
- Job processing status
- Error traces

Example log output:

```
[DocumentsService] Uploading file: document.pdf
[GcsService] File uploaded successfully: projects/xxx/document_1234.pdf
[DocumentProcessingProcessor] Starting document processing: xxx
[DoclingOcrService] Processing document with Docling OCR
[ChunkingService] Created 15 chunks from text
[EmbeddingsService] Generated 15 embeddings successfully
[DocumentProcessingProcessor] Document processing completed: xxx
```

## 🐛 Troubleshooting

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**: Ensure Redis is running

```bash
# Check Redis
redis-cli ping

# Start Redis (Docker)
docker start redis-studydocs

# Start Redis (macOS)
brew services start redis
```

### PostgreSQL Connection Error

**Solution**: Verify PostgreSQL is running and credentials are correct

```bash
psql -U postgres -d studydocs -c "SELECT 1;"
```

### Vertex AI API Error

```
Error: Embedding generation failed
```

**Solution**:

1. Verify `VERTEX_AI_API_KEY` is configured
2. Check if Vertex AI API is enabled in GCP
3. Ensure service account has "Vertex AI User" role

### Docling OCR Timeout

The system automatically falls back to local libraries (pdf-parse, mammoth) if Docling OCR is unavailable or times out. This is expected behavior and not an error.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is [MIT licensed](LICENSE).

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Bull](https://github.com/OptimalBits/bull) - Premium queue package
- [Docling](https://github.com/DS4SD/docling) - Document understanding and processing
- [Google Vertex AI](https://cloud.google.com/vertex-ai) - ML platform for embeddings
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search for PostgreSQL

---

Built with ❤️ for intelligent document processing
