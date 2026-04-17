-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Agent Memories table for "Cognitive Checkpoints"
-- This table allows AI agents to store key decisions, context snapshots, 
-- and logic patterns to be recalled semantically, saving tokens by avoiding 
-- repetitive large-context prompts.
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT public.jwt_tenant(),
  agent_id TEXT NOT NULL,           -- The identity of the agent (e.g., 'story-builder', 'lims-bot')
  content TEXT NOT NULL,            -- The actual logic/decision/context to remember
  embedding vector(1536),           -- OpenAI or similar embedding for semantic search
  tags TEXT[] DEFAULT '{}',         -- Searchable keywords
  metadata JSONB DEFAULT '{}',      -- Extra context (run_id, story_slug, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- RLS for multi-tenant safety
  CONSTRAINT tenant_id_check CHECK (tenant_id IS NOT NULL)
);

-- Index for tags
CREATE INDEX idx_agent_memories_tags ON agent_memories USING GIN (tags);

-- Enable RLS
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policy (scoped to tenant)
CREATE POLICY "Users can only see memories from their tenant"
ON agent_memories
FOR ALL
USING (tenant_id = public.jwt_tenant());

-- Helper function for semantic search
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_agent_id text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity float,
  tags TEXT[],
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) AS similarity,
    m.tags,
    m.metadata
  FROM agent_memories m
  WHERE (p_agent_id IS NULL OR m.agent_id = p_agent_id)
    AND (1 - (m.embedding <=> query_embedding) > match_threshold)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
