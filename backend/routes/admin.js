const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken, requireRole('admin'));

// --- Multer for photo uploads ---
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'photos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.params.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const totalStudents  = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='student'").get().c;
  const totalTeachers  = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='teacher'").get().c;
  const totalClasses   = db.prepare('SELECT COUNT(*) as c FROM classes').get().c;
  const totalSubjects  = db.prepare('SELECT COUNT(*) as c FROM subjects').get().c;
  const totalResults   = db.prepare('SELECT COUNT(*) as c FROM results').get().c;
  const activeSession  = db.prepare('SELECT year, term FROM sessions WHERE is_active=1').get();

  const recentResults = db.prepare(`
    SELECT r.id, u.name as student_name, u.reg_number, s.name as subject_name,
           c.name as class_name, r.ca_score, r.exam_score,
           (r.ca_score + r.exam_score) as total, r.grade, r.created_at
    FROM results r
    JOIN users u ON u.id = r.student_id
    JOIN subjects s ON s.id = r.subject_id
    JOIN classes c ON c.id = s.class_id
    ORDER BY r.created_at DESC LIMIT 10
  `).all();

  res.json({ totalStudents, totalTeachers, totalClasses, totalSubjects, totalResults, activeSession, recentResults });
});

// ─────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────
router.get('/students', (req, res) => {
  const students = db.prepare(`
    SELECT u.id, u.name, u.reg_number, u.email, u.photo_path, u.phone, u.created_at,
           c.name as class_name, c.id as class_id
    FROM users u LEFT JOIN classes c ON c.id = u.class_id
    WHERE u.role = 'student'
    ORDER BY c.name, u.name
  `).all();
  res.json(students);
});

router.post('/students', (req, res) => {
  const { name, reg_number, password, class_id, email, phone } = req.body;
  if (!name || !reg_number || !password) {
    return res.status(400).json({ message: 'Name, reg_number and password are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE reg_number = ?').get(reg_number.toUpperCase());
  if (existing) return res.status(409).json({ message: 'Registration number already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, reg_number, password_hash, role, class_id, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, reg_number.toUpperCase(), hash, 'student', class_id || null, email || null, phone || null);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Student created successfully' });
});

router.put('/students/:id', (req, res) => {
  const { name, reg_number, class_id, email, phone, password } = req.body;
  const { id } = req.params;

  const student = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'student'").get(id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name=?, reg_number=?, class_id=?, email=?, phone=?, password_hash=? WHERE id=?')
      .run(name, reg_number?.toUpperCase(), class_id || null, email || null, phone || null, hash, id);
  } else {
    db.prepare('UPDATE users SET name=?, reg_number=?, class_id=?, email=?, phone=? WHERE id=?')
      .run(name, reg_number?.toUpperCase(), class_id || null, email || null, phone || null, id);
  }

  res.json({ message: 'Student updated successfully' });
});

router.delete('/students/:id', (req, res) => {
  const { id } = req.params;
  const student = db.prepare("SELECT id, photo_path FROM users WHERE id = ? AND role = 'student'").get(id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Remove photo if exists
  if (student.photo_path) {
    const photoFile = path.join(__dirname, '..', 'uploads', 'photos', path.basename(student.photo_path));
    if (fs.existsSync(photoFile)) fs.unlinkSync(photoFile);
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'Student deleted successfully' });
});

router.post('/students/:id/photo', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const student = db.prepare("SELECT id, photo_path FROM users WHERE id = ? AND role = 'student'").get(id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  // Remove old photo
  if (student.photo_path) {
    const old = path.join(__dirname, '..', 'uploads', 'photos', path.basename(student.photo_path));
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  const photoPath = `/uploads/photos/${req.file.filename}`;
  db.prepare('UPDATE users SET photo_path = ? WHERE id = ?').run(photoPath, id);
  res.json({ photo_path: photoPath, message: 'Photo uploaded successfully' });
});

// ─────────────────────────────────────────────
// TEACHERS
// ─────────────────────────────────────────────
router.get('/teachers', (req, res) => {
  const teachers = db.prepare(`
    SELECT id, name, email, phone, created_at FROM users WHERE role = 'teacher' ORDER BY name
  `).all();
  res.json(teachers);
});

router.post('/teachers', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ message: 'Email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email.toLowerCase(), hash, 'teacher', phone || null);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Teacher created successfully' });
});

router.put('/teachers/:id', (req, res) => {
  const { name, email, phone, password } = req.body;
  const { id } = req.params;

  const teacher = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'teacher'").get(id);
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name=?, email=?, phone=?, password_hash=? WHERE id=?')
      .run(name, email?.toLowerCase(), phone || null, hash, id);
  } else {
    db.prepare('UPDATE users SET name=?, email=?, phone=? WHERE id=?')
      .run(name, email?.toLowerCase(), phone || null, id);
  }

  res.json({ message: 'Teacher updated successfully' });
});

router.delete('/teachers/:id', (req, res) => {
  const { id } = req.params;
  const teacher = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'teacher'").get(id);
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'Teacher deleted successfully' });
});

// ─────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────
router.get('/classes', (req, res) => {
  const classes = db.prepare(`
    SELECT c.*, COUNT(u.id) as student_count
    FROM classes c LEFT JOIN users u ON u.class_id = c.id AND u.role = 'student'
    GROUP BY c.id ORDER BY c.name
  `).all();
  res.json(classes);
});

router.post('/classes', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Class name is required' });
  const existing = db.prepare('SELECT id FROM classes WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ message: 'Class already exists' });

  const result = db.prepare('INSERT INTO classes (name) VALUES (?)').run(name);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Class created successfully' });
});

router.delete('/classes/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM classes WHERE id = ?').run(id);
  res.json({ message: 'Class deleted' });
});

// ─────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────
router.get('/subjects', (req, res) => {
  const { class_id } = req.query;
  let query = `SELECT s.*, c.name as class_name FROM subjects s JOIN classes c ON c.id = s.class_id`;
  const params = [];
  if (class_id) { query += ' WHERE s.class_id = ?'; params.push(class_id); }
  query += ' ORDER BY c.name, s.name';
  res.json(db.prepare(query).all(...params));
});

router.post('/subjects', (req, res) => {
  const { name, class_id } = req.body;
  if (!name || !class_id) return res.status(400).json({ message: 'Subject name and class are required' });

  const existing = db.prepare('SELECT id FROM subjects WHERE name = ? AND class_id = ?').get(name, class_id);
  if (existing) return res.status(409).json({ message: 'Subject already exists in this class' });

  const result = db.prepare('INSERT INTO subjects (name, class_id) VALUES (?, ?)').run(name, class_id);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Subject created successfully' });
});

router.delete('/subjects/:id', (req, res) => {
  db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Subject deleted' });
});

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────
router.get('/sessions', (req, res) => {
  res.json(db.prepare('SELECT * FROM sessions ORDER BY year DESC, term').all());
});

router.post('/sessions', (req, res) => {
  const { year, term } = req.body;
  if (!year || !term) return res.status(400).json({ message: 'Year and term are required' });
  const existing = db.prepare('SELECT id FROM sessions WHERE year = ? AND term = ?').get(year, term);
  if (existing) return res.status(409).json({ message: 'Session already exists' });

  const result = db.prepare('INSERT INTO sessions (year, term) VALUES (?, ?)').run(year, term);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Session created' });
});

router.put('/sessions/:id/activate', (req, res) => {
  db.prepare('UPDATE sessions SET is_active = 0').run();
  db.prepare('UPDATE sessions SET is_active = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Session activated' });
});

router.delete('/sessions/:id', (req, res) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Session deleted' });
});

// ─────────────────────────────────────────────
// ALL RESULTS
// ─────────────────────────────────────────────
router.get('/results', (req, res) => {
  const { session_id, class_id, student_id } = req.query;

  let query = `
    SELECT r.id, u.name as student_name, u.reg_number,
           c.name as class_name, sub.name as subject_name,
           sess.year, sess.term,
           r.ca_score, r.exam_score, (r.ca_score + r.exam_score) as total_score,
           r.grade, r.remark, t.name as teacher_name, r.created_at
    FROM results r
    JOIN users u ON u.id = r.student_id
    JOIN subjects sub ON sub.id = r.subject_id
    JOIN classes c ON c.id = sub.class_id
    JOIN sessions sess ON sess.id = r.session_id
    LEFT JOIN users t ON t.id = r.uploaded_by
    WHERE 1=1
  `;
  const params = [];

  if (session_id) { query += ' AND r.session_id = ?'; params.push(session_id); }
  if (class_id)   { query += ' AND sub.class_id = ?'; params.push(class_id); }
  if (student_id) { query += ' AND r.student_id = ?'; params.push(student_id); }

  query += ' ORDER BY c.name, u.name, sub.name';

  res.json(db.prepare(query).all(...params));
});

module.exports = router;
