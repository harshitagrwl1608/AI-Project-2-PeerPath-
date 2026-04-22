import pool from './db.js';
async function run() {
    const res = await pool.query('SELECT * FROM users LIMIT 1');
    console.log(res.rows[0]);
    process.exit(0);
}
run();
