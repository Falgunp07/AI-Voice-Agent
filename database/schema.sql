-- PropCall AI Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  location TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area NUMERIC,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  budget TEXT,
  location TEXT,
  preferences TEXT,
  status TEXT CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'callback')) DEFAULT 'new',
  lead_score TEXT CHECK (lead_score IN ('hot', 'warm', 'cold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call logs table
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  duration INTEGER, -- in seconds
  status TEXT CHECK (status IN ('completed', 'failed', 'no_answer', 'busy')) NOT NULL,
  transcript TEXT,
  recording_url TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
  total_leads INTEGER DEFAULT 0,
  called_leads INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX idx_call_logs_created_at ON call_logs(created_at);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Row Level Security (RLS) - Enable later with auth
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
