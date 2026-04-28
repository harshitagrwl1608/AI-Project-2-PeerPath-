import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Helper to get or create ethereal transporter
let transporter = null;
const getTransporter = async () => {
    if (transporter) return transporter;
    
    // Check if we have real SMTP configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log("Using real SMTP server");
    } else {
        // Fallback to Ethereal
        let testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log("Using Ethereal for testing. Provide SMTP_USER in .env for real emails.");
    }
    return transporter;
};

// 1. Login with Email and Password
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found. Please sign up.' });
        }

        const user = result.rows[0];
        if (!user.password) {
            return res.status(401).json({ error: 'Please sign up or use forgot password to set a password.' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password.' });
        }

        // Clean password before sending to client
        delete user.password;
        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Request OTP
router.post('/request-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        // Generate a 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

        // Upsert into auth_otps table
        await pool.query(`
            INSERT INTO auth_otps (email, otp, "expiresAt") 
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO UPDATE SET otp = $2, "expiresAt" = $3
        `, [email, otp, expiresAt]);

        // Send email
        const mailTransporter = await getTransporter();
        const info = await mailTransporter.sendMail({
            from: '"PeerPath Support" <support@peerpath.edu>',
            to: email,
            subject: 'Your PeerPath Verification Code',
            text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
            html: `<b>Your OTP is: ${otp}</b><br>It will expire in 5 minutes.`
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`Preview URL: ${previewUrl}`);
            // Returning the preview URL just for easy dev access (in production, remove this)
            return res.json({ message: 'OTP sent', previewUrl });
        }

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('OTP request error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// 3. Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const result = await pool.query('SELECT * FROM auth_otps WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'No OTP requested for this email' });
        }

        const record = result.rows[0];
        if (new Date() > new Date(record.expiresAt)) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        if (record.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Delete OTP after successful verification
        await pool.query('DELETE FROM auth_otps WHERE email = $1', [email]);

        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// 4. Change Password (for logged-in users or after forgot password)
router.post('/change-password', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

export default router;
