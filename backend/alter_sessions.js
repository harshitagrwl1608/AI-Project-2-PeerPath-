import pool from './db.js';

async function alterTable() {
    try {
        console.log("Altering sessions table columns from DATE/TIME to VARCHAR...");
        await pool.query(`
            ALTER TABLE sessions 
            ALTER COLUMN date TYPE VARCHAR,
            ALTER COLUMN time TYPE VARCHAR;
        `);
        console.log("Successfully altered columns!");
    } catch (err) {
        console.error("Error altering table:", err.message);
    } finally {
        await pool.end();
    }
}

alterTable();
