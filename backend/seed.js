import pool from './db.js';

const INITIAL_DUMMY_USERS = [
    {
        name: "Aman Gupta",
        college: "IIT Delhi",
        year: "3rd",
        branch: "CSE",
        rating: 4.8,
        totalSessions: 12,
        skillsTeach: ["Python", "React"],
        skillsLearn: ["UI/UX Design", "Guitar"],
        plan: "pro",
        requestsUsed: 0,
        createdAt: "2025-10-14T08:00:00Z",
        email: "aman.gupta@iitd.ac.in",
        showEmail: true,
    },
    {
        name: "Priya Sharma",
        college: "DTU",
        year: "2nd",
        branch: "ECE",
        rating: 4.9,
        totalSessions: 8,
        skillsTeach: ["UI/UX Design", "Figma"],
        skillsLearn: ["Python", "React"],
        plan: "free",
        requestsUsed: 2,
        createdAt: "2025-11-02T10:30:00Z",
        email: "priya.s@dtu.ac.in",
        showEmail: false,
    },
    {
        name: "Rohit Verma",
        college: "NSUT",
        year: "4th",
        branch: "IT",
        rating: 4.5,
        totalSessions: 5,
        skillsTeach: ["Java", "C++"],
        skillsLearn: ["Public Speaking", "Data Analytics"],
        plan: "free",
        requestsUsed: 4,
        createdAt: "2026-01-20T14:15:00Z",
        email: "rohit.verma@nsut.ac.in",
        showEmail: true,
    },
    {
        name: "Sneha Reddy",
        college: "IIIT Delhi",
        year: "1st",
        branch: "CSAI",
        rating: null,
        totalSessions: 0,
        skillsTeach: ["Video Editing"],
        skillsLearn: ["Java", "C++"],
        plan: "free",
        requestsUsed: 0,
        createdAt: "2026-03-05T09:45:00Z",
        email: "sneha.r@iiitd.ac.in",
        showEmail: false,
    },
];

async function seed() {
    try {
        console.log("Starting seed process...");
        for (const user of INITIAL_DUMMY_USERS) {
            const query = `
                INSERT INTO users (
                    email, name, college, year, branch, 
                    "skillsTeach", "skillsLearn", "showEmail", 
                    "requestsUsed", plan, rating, "totalSessions", "createdAt"
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (email) DO NOTHING;
            `;
            const values = [
                user.email, user.name, user.college, user.year, user.branch,
                JSON.stringify(user.skillsTeach), JSON.stringify(user.skillsLearn),
                user.showEmail, user.requestsUsed, user.plan, 
                user.rating, user.totalSessions, user.createdAt
            ];
            await pool.query(query, values);
            console.log(`Inserted demo user: ${user.name}`);
        }
    } catch (err) {
        console.error("Seed error:", err);
    } finally {
        await pool.end();
        console.log("Seed process completed.");
    }
}

seed();
