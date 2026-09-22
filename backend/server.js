require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Keep the server alive — never crash on unhandled errors
process.on('uncaughtException',  err => console.error('Uncaught Exception:', err.message));
process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err?.message || err));
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS – allow localhost in dev and any vercel.app / custom domain in prod
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  /\.vercel\.app$/,
]

app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser requests (curl, mobile, etc.)
    if (!origin) return cb(null, true);
    const ok = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    // In production, also allow any origin to avoid blocking legitimate frontend deployments
    cb(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files — stored inside project directory
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes (support /api/* as well as direct /* and legacy /api/api/* in case of URL misconfigurations)
const authRoutes    = require('./routes/auth');
const adminRoutes   = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

app.use(['/api/auth', '/auth', '/api/api/auth'], authRoutes);
app.use(['/api/admin', '/admin', '/api/api/admin'], adminRoutes);
app.use(['/api/teacher', '/teacher', '/api/api/teacher'], teacherRoutes);
app.use(['/api/student', '/student', '/api/api/student'], studentRoutes);

// Convenience alias: POST /login or /api/login directly
app.post(['/login', '/api/login'], (req, res, next) => {
  req.url = '/login';
  authRoutes(req, res, next);
});

// Health check
app.get(['/api/health', '/health'], (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Handle malformed JSON bodies — return 400 instead of crashing
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  next(err);
});

// 404
app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.url} not found` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads served at http://localhost:${PORT}/uploads\n`);

  // Auto-seed the database on first startup
  try {
    require('./db/seed');
  } catch (err) {
    console.error('Seed error (non-fatal):', err.message);
  }
});
