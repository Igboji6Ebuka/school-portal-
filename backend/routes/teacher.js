const express = require('express');
const multer  = require('multer');
const { parse } = require('csv-parse/sync');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireRole('teacher', 'admin'));

// Multer for CSV
const csvUpload = multer({ dest: path.join(__dirname, '..', 'uploads', 'tmp') });

function getGrade(total) {
  if (total >= 75) return { grade: 'A1', remark: 'Excellent' };
  if (total >= 70) return { grade: 'B2', remark: 'Very Good' };
  if (total >= 65) return { grade: 'B3', remark: 'Good' };
  if (total >= 60) return { grade: 'C4', remark: 'Credit' };
  if (total >= 55) return { grade: 'C5', remark: 'Credit' };
  if (total >= 50) return { grade: 'C6', remark: 'Credit' };
  if (total >= 45) return { grade: 'D7', remark: 'Pass' };
  if (total >= 40) return { grade: 'E8', remark: 'Pass' };
  return { grade: 'F9', remark: 'Fail' };
}

// GET /api/teacher/classes
router.get('/classes', (req, res) => {
  res.json(db.prepare('SELECT * FROM classes ORDER BY name').all());
});

// GET /api/teacher/subjects?class_id=
router.get('/subjects', (req, res) => {
  const { class_id } = req.query;
  if (!class_id) return res.status(400).json({ message: 'class_id is required' });
  res.json(db.prepare('SELECT * FROM subjects WHERE class_id = ? ORDER BY name').all(class_id));
});

// GET /api/teacher/sessions
router.get('/sessions', (req, res) => {
  res.json(db.prepare('SELECT * FROM sessions ORDER BY year DESC, term').all());
});

// GET /api/teacher/students?class_id=
router.get('/students', (req, res) => {
  const { class_id } = req.query;
  if (!class_id) return res.status(400).json({ message: 'class_id is required' });

  const students = db.prepare(`
    SELECT id, name, reg_number, photo_path FROM users
    WHERE role = 'student' AND class_id = ?
    ORDER BY name
  `).all(class_id);
  res.json(students);
});

// GET /api/teacher/results?session_id=&subject_id=&class_id=
router.get('/results', (req, res) => {
  const { session_id, subject_id, class_id } = req.query;
  if (!session_id || !subject_id) {
    return res.status(400).json({ message: 'session_id and subject_id are required' });
  }

  const results = db.prepare(`
    SELECT r.id, u.name as student_name, u.reg_number, u.photo_path,
           r.ca_score, r.exam_score, (r.ca_score + r.exam_score) as total_score,
           r.grade, r.remark
    FROM results r
    JOIN users u ON u.id = r.student_id
    WHERE r.session_id = ? AND r.subject_id = ?
    ORDER BY u.name
  `).all(session_id, subject_id);

  res.json(results);
});

// POST /api/teacher/results  (single or bulk form submission)
router.post('/results', (req, res) => {
  const { subject_id, session_id, results } = req.body;

  if (!subject_id || !session_id || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ message: 'subject_id, session_id and results[] are required' });
  }

  const insertOrUpdate = db.prepare(`
    INSERT INTO results (student_id, subject_id, session_id, ca_score, exam_score, grade, remark, uploaded_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, subject_id, session_id)
    DO UPDATE SET ca_score=excluded.ca_score, exam_score=excluded.exam_score,
                  grade=excluded.grade, remark=excluded.remark,
                  uploaded_by=excluded.uploaded_by, updated_at=CURRENT_TIMESTAMP
  `);

  const uploadMany = db.transaction((rows) => {
    let count = 0;
    rows.forEach((r) => {
      const ca   = Math.min(30, Math.max(0, parseFloat(r.ca_score)   || 0));
      const exam = Math.min(70, Math.max(0, parseFloat(r.exam_score) || 0));
      const total = ca + exam;
      const { grade, remark } = getGrade(total);
      insertOrUpdate.run(r.student_id, subject_id, session_id, ca, exam, grade, remark, req.user.id);
      count++;
    });
    return count;
  });

  const count = uploadMany(results);
  res.json({ message: `${count} result(s) saved successfully` });
});

// POST /api/teacher/results/csv
router.post('/results/csv', csvUpload.single('file'), (req, res) => {
  const { subject_id, session_id } = req.body;

  if (!subject_id || !session_id || !req.file) {
    return res.status(400).json({ message: 'subject_id, session_id and CSV file are required' });
  }

  try {
    const content = fs.readFileSync(req.file.path, 'utf8');
    const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });

    if (!rows.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'CSV file is empty or has no valid rows' });
    }

    const insertOrUpdate = db.prepare(`
      INSERT INTO results (student_id, subject_id, session_id, ca_score, exam_score, grade, remark, uploaded_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, subject_id, session_id)
      DO UPDATE SET ca_score=excluded.ca_score, exam_score=excluded.exam_score,
                    grade=excluded.grade, remark=excluded.remark,
                    uploaded_by=excluded.uploaded_by, updated_at=CURRENT_TIMESTAMP
    `);

    const errors = [];
    const uploadCSV = db.transaction(() => {
      let count = 0;
      rows.forEach((row, i) => {
        const reg = (row.reg_number || '').toUpperCase().trim();
        if (!reg) { errors.push(`Row ${i + 2}: Missing reg_number`); return; }

        const student = db.prepare("SELECT id FROM users WHERE reg_number = ? AND role = 'student'").get(reg);
        if (!student) { errors.push(`Row ${i + 2}: Student "${reg}" not found`); return; }

        const ca   = Math.min(30, Math.max(0, parseFloat(row.ca_score)   || 0));
        const exam = Math.min(70, Math.max(0, parseFloat(row.exam_score) || 0));
        const total = ca + exam;
        const { grade, remark } = getGrade(total);

        insertOrUpdate.run(student.id, subject_id, session_id, ca, exam, grade, remark, req.user.id);
        count++;
      });
      return count;
    });

    const count = uploadCSV();
    fs.unlinkSync(req.file.path);

    res.json({
      message: `${count} result(s) uploaded from CSV`,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Failed to parse CSV: ' + err.message });
  }
});

module.exports = router;
