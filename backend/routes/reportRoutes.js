import express from 'express';
import pool from '../db.js';

const router = express.Router();

const ADMIN_EMAIL = 'admin@gmail.com';
const isAdmin = (req) => req.headers['x-user-email'] === ADMIN_EMAIL;

// POST /api/reports - Submit a new report
router.post('/', async (req, res) => {
    try {
        const { reporterEmail, reportedEmail, reason } = req.body;

        if (!reporterEmail || !reportedEmail || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = `
            INSERT INTO reports ("reporterEmail", "reportedEmail", reason)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [reporterEmail, reportedEmail, reason];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error submitting report:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET /api/reports - (Admin) Fetch all reports
router.get('/', async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const query = `
            SELECT r.*, 
                   u1.name as "reporterName", 
                   u2.name as "reportedName"
            FROM reports r
            LEFT JOIN users u1 ON r."reporterEmail" = u1.email
            LEFT JOIN users u2 ON r."reportedEmail" = u2.email
            ORDER BY r."createdAt" DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// PATCH /api/reports/:id - (Admin) Update report status
router.patch('/:id', async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const { id } = req.params;
        const { status } = req.body;

        const result = await pool.query(
            'UPDATE reports SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating report:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// DELETE /api/reports/:id - (Admin) Delete a report
router.delete('/:id', async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const { id } = req.params;
        const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error('Error deleting report:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

export default router;
