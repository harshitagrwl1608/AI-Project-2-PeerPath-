import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

const ADMIN_EMAIL = 'admin@gmail.com';
const isAdmin = (req) => req.headers['x-user-email'] === ADMIN_EMAIL;

// GET /api/users - Fetch all users (for discovery feed)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE email != $1', [ADMIN_EMAIL]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// GET /api/users/:email - Fetch a single user profile
router.get('/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST /api/users - Create or update user profile
router.post('/', async (req, res) => {
    try {
        const {
            email, name, college, year, branch,
            skillsTeach, skillsLearn, showEmail,
            requestsUsed, plan, rating, totalSessions, password
        } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        let query, values;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query = `
                INSERT INTO users (
                    email, name, college, year, branch, 
                    "skillsTeach", "skillsLearn", "showEmail", 
                    "requestsUsed", plan, rating, "totalSessions", password
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    college = EXCLUDED.college,
                    year = EXCLUDED.year,
                    branch = EXCLUDED.branch,
                    "skillsTeach" = EXCLUDED."skillsTeach",
                    "skillsLearn" = EXCLUDED."skillsLearn",
                    "showEmail" = EXCLUDED."showEmail",
                    "requestsUsed" = EXCLUDED."requestsUsed",
                    plan = EXCLUDED.plan,
                    rating = EXCLUDED.rating,
                    "totalSessions" = EXCLUDED."totalSessions",
                    password = COALESCE(EXCLUDED.password, users.password)
                RETURNING *;
            `;
            values = [
                email, name || null, college || null, year || null, branch || null,
                JSON.stringify(skillsTeach || []), JSON.stringify(skillsLearn || []),
                showEmail || false, requestsUsed || 0, plan || 'free', 
                rating || null, totalSessions || 0, hashedPassword
            ];
        } else {
            query = `
                INSERT INTO users (
                    email, name, college, year, branch, 
                    "skillsTeach", "skillsLearn", "showEmail", 
                    "requestsUsed", plan, rating, "totalSessions"
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    college = EXCLUDED.college,
                    year = EXCLUDED.year,
                    branch = EXCLUDED.branch,
                    "skillsTeach" = EXCLUDED."skillsTeach",
                    "skillsLearn" = EXCLUDED."skillsLearn",
                    "showEmail" = EXCLUDED."showEmail",
                    "requestsUsed" = EXCLUDED."requestsUsed",
                    plan = EXCLUDED.plan,
                    rating = EXCLUDED.rating,
                    "totalSessions" = EXCLUDED."totalSessions"
                RETURNING *;
            `;
            values = [
                email, name || null, college || null, year || null, branch || null,
                JSON.stringify(skillsTeach || []), JSON.stringify(skillsLearn || []),
                showEmail || false, requestsUsed || 0, plan || 'free', 
                rating || null, totalSessions || 0
            ];
        }

        const result = await pool.query(query, values);
        
        // Clean password before returning
        const user = result.rows[0];
        delete user.password;
        res.json(user);

    } catch (err) {
        console.error('Error saving user profile:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// DELETE /api/users/:email - Admin: Remove a user and all their sessions
router.delete('/:email', async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const { email } = req.params;
        // Delete all sessions for this user first (avoids FK constraint errors)
        await pool.query(
            'DELETE FROM sessions WHERE "requesterEmail" = $1 OR "targetUserEmail" = $1',
            [email]
        );
        // Now delete the user
        const result = await pool.query('DELETE FROM users WHERE email = $1 RETURNING *', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, removed: result.rows[0] });
    } catch (err) {
        console.error('Error removing user (admin):', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

export default router;
