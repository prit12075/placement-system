const express = require('express');
const path = require('path');

const app = express();

const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const studentRoutes = require('./src/routes/student');

app.use(express.json());
// Specifically serve static files, handling index.html mapping directly in our routes if needed.
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to routing index page if hitting root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Modular Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes);          // Keeping this as `/api` to avoid breaking current JS initially
app.use('/api/student', studentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🚀  PlaceMe Modular → http://localhost:${PORT}\n`));
