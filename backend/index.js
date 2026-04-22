import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { initDb } from './db.js';

import userRoutes from './routes/userRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
});

// Periodic Cleanup Task
const cleanupOldSessions = async () => {
    try {
        console.log('Running automated storage cleanup...');
        const res = await pool.query(`
            DELETE FROM sessions 
            WHERE "createdAt" < NOW() - INTERVAL '14 days'
        `);
        if (res.rowCount > 0) {
            console.log(`Cleaned up ${res.rowCount} old sessions to save DB space.`);
        }
    } catch (err) {
        console.error('Failed to thoroughly clean DB:', err.message);
    }
};

// Start the server and initialize the database tables if needed
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initDb();
    
    // Initial cleanup on boot
    await cleanupOldSessions();

    // 24-hour cleanup cycle while running
    setInterval(cleanupOldSessions, 24 * 60 * 60 * 1000);
});
