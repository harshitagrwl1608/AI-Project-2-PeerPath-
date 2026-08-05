import pool, { initDb } from './db.js';

const dropTables = async () => {
    try {
        console.log('Dropping all existing tables...');
        await pool.query(`
            DROP TABLE IF EXISTS session_media CASCADE;
            DROP TABLE IF EXISTS notifications CASCADE;
            DROP TABLE IF EXISTS auth_otps CASCADE;
            DROP TABLE IF EXISTS reports CASCADE;
            DROP TABLE IF EXISTS sessions CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);
        console.log('All tables dropped successfully.');
    } catch (err) {
        console.error('Error dropping tables:', err.message);
    }
};

const rebuild = async () => {
    await dropTables();
    await initDb();
    process.exit(0);
};

rebuild();
