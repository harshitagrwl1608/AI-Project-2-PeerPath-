import pool from './db.js';
import bcrypt from 'bcryptjs';

async function migratePasswords() {
    try {
        console.log("Starting password migration for existing users...");
        
        // Fetch all users
        const result = await pool.query('SELECT email, name FROM users');
        const users = result.rows;

        for (const user of users) {
            // Get first name or default to name or "User"
            let firstName = "User";
            if (user.name) {
                firstName = user.name.split(' ')[0];
                // Remove non-alphanumeric characters for clean password
                firstName = firstName.replace(/[^a-zA-Z0-9]/g, '');
            }
            if (!firstName) firstName = "User";

            const rawPassword = `${firstName}@123`;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(rawPassword, salt);

            await pool.query(
                'UPDATE users SET password = $1 WHERE email = $2 AND password IS NULL',
                [hashedPassword, user.email]
            );

            console.log(`Migrated user: ${user.email} (Password format: ${rawPassword})`);
        }

        console.log("Password migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migratePasswords();
