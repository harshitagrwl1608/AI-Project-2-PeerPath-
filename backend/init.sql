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
    password VARCHAR,
    availability JSONB DEFAULT '{}'::JSONB,
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
    rating NUMERIC,
    feedback TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    "reporterEmail" VARCHAR REFERENCES users(email),
    "reportedEmail" VARCHAR REFERENCES users(email),
    reason TEXT NOT NULL,
    status VARCHAR DEFAULT 'pending',
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Auth OTPs Table
CREATE TABLE IF NOT EXISTS auth_otps (
    email VARCHAR PRIMARY KEY,
    otp VARCHAR NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL
);

-- Real-Time Notifications tracking table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    "userEmail" VARCHAR NOT NULL,
    type VARCHAR NOT NULL, -- 'request', 'status_update', 'upcoming'
    title VARCHAR NOT NULL,
    message TEXT,
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Session Media Table for Chat Sharing
CREATE TABLE IF NOT EXISTS session_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID REFERENCES sessions(id) ON DELETE CASCADE,
    "senderEmail" VARCHAR REFERENCES users(email),
    filename VARCHAR NOT NULL,
    mimetype VARCHAR NOT NULL,
    size INTEGER NOT NULL,
    data BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP DEFAULT NOW()
);
