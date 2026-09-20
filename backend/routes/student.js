const express = require('express');
const db = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireRole('student'));

// GET /api/student/profile
router.get('/profile', (req, res) => {
  const student = db.prepare(`
    SELECT u.id, u.name, u.reg_number, u.email, u.phone, u.photo_path, u.created_at,
           c.name as class_name, c.id as class_id
    FROM users u LEFT JOIN classes c ON c.id = u.class_id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!student) return res.status(404).json({ message: 'Profile not found' });
  res.json(student);
});

// GET /api/student/sessions  – sessions that have at least one result for this student
router.get('/sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT DISTINCT sess.id, sess.year, sess.term, sess.is_active
    FROM sessions sess
    JOIN results r ON r.session_id = sess.id
    WHERE r.student_id = ?
    ORDER BY sess.year DESC, sess.term
  `).all(req.user.id);
  res.json(sessions);
});

// GET /api/student/results?session_id=
router.get('/results', (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ message: 'session_id is required' });

  // Get student's class
  const student = db.prepare('SELECT class_id FROM users WHERE id = ?').get(req.user.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const results = db.prepare(`
    SELECT sub.name as subject_name,
           r.ca_score, r.exam_score, (r.ca_score + r.exam_score) as total_score,
           r.grade, r.remark
    FROM results r
    JOIN subjects sub ON sub.id = r.subject_id
    WHERE r.student_id = ? AND r.session_id = ?
    ORDER BY sub.name
  `).all(req.user.id, session_id);

  const session = db.prepare('SELECT year, term FROM sessions WHERE id = ?').get(session_id);

  // Compute summary stats
  const totalSubjects = results.length;
  const totalScore    = results.reduce((s, r) => s + r.total_score, 0);
  const average       = totalSubjects > 0 ? (totalScore / totalSubjects).toFixed(1) : 0;
  const failed        = results.filter((r) => r.grade === 'F9').length;

  // Compute class position for this session
  let position = null;
  if (student.class_id) {
    const classmates = db.prepare(`
      SELECT r2.student_id, SUM(r2.ca_score + r2.exam_score) as total
      FROM results r2
      JOIN subjects sub2 ON sub2.id = r2.subject_id
      WHERE r2.session_id = ? AND sub2.class_id = ?
      GROUP BY r2.student_id
      ORDER BY total DESC
    `).all(session_id, student.class_id);

    const rank = classmates.findIndex((c) => c.student_id === req.user.id);
    if (rank !== -1) position = rank + 1;
  }

  res.json({ results, session, summary: { totalSubjects, totalScore, average, failed, position } });
});

module.exports = router;
