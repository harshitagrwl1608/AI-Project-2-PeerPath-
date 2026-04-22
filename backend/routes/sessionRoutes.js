import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/sessions - Get all sessions where the user is requester or target
router.get('/', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        if (!email) {
            return res.status(401).json({ error: 'Unauthorized: No email provided' });
        }

        const result = await pool.query(
            'SELECT * FROM sessions WHERE "requesterEmail" = $1 OR "targetUserEmail" = $1 ORDER BY "createdAt" DESC',
            [email]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET /api/sessions/:id - Get a specific session
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching session:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST /api/sessions - Create a session
router.post('/', async (req, res) => {
    try {
        const { targetUserEmail, status, skill, message, date, time, messages } = req.body;
        const requesterEmail = req.headers['x-user-email'] || req.body.requesterEmail;

        if (!requesterEmail || !targetUserEmail) {
            return res.status(400).json({ error: 'Requester and target emails are required' });
        }

        const query = `
            INSERT INTO sessions (
                "requesterEmail", "targetUserEmail", status, skill, message, date, time, messages
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [
            requesterEmail, targetUserEmail, 
            status || 'pending', skill || null,
            message || null, 
            date || null, time || null, 
            JSON.stringify(messages || [])
        ];

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Error creating session:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// PATCH /api/sessions/:id - Update session
router.patch('/:id', async (req, res) => {
    try {
        const { status, date, time, meetLink, messages } = req.body;
        const { id } = req.params;

        const updates = [];
        const values = [];
        let index = 1;

        if (status !== undefined) { updates.push(`status = $${index++}`); values.push(status); }
        if (date !== undefined) { updates.push(`date = $${index++}`); values.push(date); }
        if (time !== undefined) { updates.push(`time = $${index++}`); values.push(time); }
        if (meetLink !== undefined) { updates.push(`"meetLink" = $${index++}`); values.push(meetLink); }
        // Allow updating the full messages array (e.g., to persist reschedule accept/decline status)
        if (messages !== undefined) { updates.push(`messages = $${index++}`); values.push(JSON.stringify(messages)); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE sessions SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating session:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// PATCH /api/sessions/:id/messages/:msgIndex - Update a single message's status atomically
router.patch('/:id/messages/:msgIndex', async (req, res) => {
    try {
        const { id, msgIndex } = req.params;
        const { status } = req.body;

        if (!status) return res.status(400).json({ error: 'status is required' });

        // Use jsonb_set to update just the status field of the message at the given index
        const result = await pool.query(`
            UPDATE sessions
            SET messages = jsonb_set(messages, '{${parseInt(msgIndex, 10)},status}', $1::jsonb, false)
            WHERE id = $2
            RETURNING *
        `, [JSON.stringify(status), id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating message status:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// DELETE /api/sessions/:id - Delete a session
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM sessions WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ message: 'Session deleted' });
    } catch (err) {
        console.error('Error deleting session:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST /api/sessions/:id/messages - Add a chat message
router.post('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const newMessage = req.body; // { sender, text, timestamp, etc. }
        // Ensure timestamp is present if not provided by frontend
        if (!newMessage.timestamp) newMessage.timestamp = new Date().toISOString();

        // Use a CASE statement to slice the array if it hits 50, popping the oldest index 0
        const result = await pool.query(`
            UPDATE sessions 
            SET messages = CASE 
                WHEN jsonb_array_length(messages) >= 50 
                THEN (messages - 0) || $1::jsonb
                ELSE messages || $1::jsonb
            END
            WHERE id = $2
            RETURNING *
        `, [JSON.stringify([newMessage]), id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Return the added message matching frontend expectation
        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Error adding session message:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

export default router;
