-- Migration: Add pgvector indexes for document_chunks
-- Description: Create vector indexes for efficient similarity search
-- Date: 2025-11-02

-- Create IVFFlat index for cosine distance
-- Good for datasets with 10k-1M vectors
-- Adjust 'lists' parameter based on dataset size:
--   - Small datasets (< 100k): lists = 100
--   - Medium datasets (100k-500k): lists = 300
--   - Large datasets (> 500k): lists = 1000
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_ivfflat 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Alternative: HNSW index (commented out by default)
-- Better query performance but slower inserts
-- Uncomment if you have high query volume and can tolerate slower writes
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw 
-- ON document_chunks 
-- USING hnsw (embedding vector_cosine_ops);

-- Index on documentId for filtered searches
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id 
ON document_chunks (documentId);

-- Index on createdAt for time-based queries
CREATE INDEX IF NOT EXISTS idx_document_chunks_created_at 
ON document_chunks (createdAt);

-- Composite index for common query pattern: documentId + non-null embeddings
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_embedding 
ON document_chunks (documentId) 
WHERE embedding IS NOT NULL;

-- Add comment to embedding column
COMMENT ON COLUMN document_chunks.embedding IS '768-dimensional embedding vector from text-embedding-004 model';

-- Performance tips:
-- 1. IVFFlat requires training on data, so best to create after inserting some vectors
-- 2. HNSW is more accurate but uses more memory
-- 3. For datasets < 10k vectors, you might not need an index
-- 4. Monitor query performance and adjust accordingly
