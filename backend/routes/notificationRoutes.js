import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/notifications - Get all notifications for the user
router.get('/', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        if (!email) {
            return res.status(401).json({ error: 'Unauthorized: No email provided' });
        }

        const query = `
            SELECT * FROM notifications 
            WHERE "userEmail" = $1 
            ORDER BY "createdAt" DESC
        `;
        const result = await pool.query(query, [email]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        if (!email) {
            return res.status(401).json({ error: 'Unauthorized: No email provided' });
        }

        const query = `
            UPDATE notifications 
            SET "isRead" = TRUE 
            WHERE "userEmail" = $1 AND "isRead" = FALSE
            RETURNING *;
        `;
        const result = await pool.query(query, [email]);
        res.json({ message: 'All notifications marked as read', count: result.rowCount });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// PATCH /api/notifications/:id/read - Mark single as read
router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const email = req.headers['x-user-email'];
        
        if (!email) {
            return res.status(401).json({ error: 'Unauthorized: No email provided' });
        }

        const query = `
            UPDATE notifications 
            SET "isRead" = TRUE 
            WHERE id = $1 AND "userEmail" = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [id, email]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

export default router;
