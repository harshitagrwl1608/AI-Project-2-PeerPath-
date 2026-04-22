import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Successfully connected to Render PostgreSQL');
    release();
});

export const initDb = async () => {
    try {
        const sqlScript = fs.readFileSync(path.resolve('init.sql'), 'utf-8');
        await pool.query(sqlScript);
        console.log('Database initialized (tables verified/created).');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};

export default pool;
