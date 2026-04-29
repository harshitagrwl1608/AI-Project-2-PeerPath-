import pool from './db.js';

const createTable = async () => {
    try {
        await pool.query(`
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
        `);
        console.log("session_media table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
};

createTable();
