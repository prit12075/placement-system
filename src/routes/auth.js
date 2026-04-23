const express = require('express');
const { one } = require('../db/database');
const router = express.Router();

// A real system would use bcrypt, tokens etc. This is lightweight auth.
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = one('SELECT * FROM users WHERE email = ? AND password = ?', email, password);
    if (!user) return res.status(401).json({ error: 'Invalid config or password' });

    // A very basic session token: we just pass back the user info.
    // The frontend can store this in localStorage for this conceptual app.
    res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        student_id: user.student_id
    });
});

module.exports = router;
