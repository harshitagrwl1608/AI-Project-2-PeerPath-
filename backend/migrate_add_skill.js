/**
 * migrate_add_skill.js
 * One-time migration: adds the 'skill' VARCHAR column to the sessions table.
 * Safe to run multiple times (uses IF NOT EXISTS guard).
 */
import pool from './db.js';

async function migrate() {
    try {
        console.log('Running migration: adding skill column to sessions...');
        await pool.query(`
            ALTER TABLE sessions 
            ADD COLUMN IF NOT EXISTS skill VARCHAR;
        `);
        console.log('Migration complete: skill column added (or already existed).');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
