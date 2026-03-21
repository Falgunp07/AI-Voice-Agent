-- Create messages table for WhatsApp-style chat history
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('text', 'image', 'template', 'location')) DEFAULT 'text',
  status TEXT CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster chat history retrieval
CREATE INDEX IF NOT EXISTS idx_messages_lead ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view/manage messages
CREATE POLICY "Users can manage messages" ON messages
  FOR ALL USING (auth.role() = 'authenticated');
