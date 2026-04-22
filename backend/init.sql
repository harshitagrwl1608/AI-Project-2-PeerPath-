-- Users Table
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR PRIMARY KEY,
    name VARCHAR,
    college VARCHAR,
    year VARCHAR,
    branch VARCHAR,
    "skillsTeach" JSONB DEFAULT '[]'::JSONB,
    "skillsLearn" JSONB DEFAULT '[]'::JSONB,
    "showEmail" BOOLEAN DEFAULT false,
    "requestsUsed" INTEGER DEFAULT 0,
    plan VARCHAR DEFAULT 'free',
    rating NUMERIC,
    "totalSessions" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "requesterEmail" VARCHAR REFERENCES users(email),
    "targetUserEmail" VARCHAR REFERENCES users(email),
    status VARCHAR DEFAULT 'pending',
    skill VARCHAR,
    message TEXT,
    date VARCHAR,
    time VARCHAR,
    "meetLink" VARCHAR,
    messages JSONB DEFAULT '[]'::JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW()
);
