const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'school_secret';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required' });
  }

  // Try email first, then reg_number
  let user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(identifier.toLowerCase().trim());

  if (!user) {
    user = db
      .prepare('SELECT * FROM users WHERE reg_number = ?')
      .get(identifier.toUpperCase().trim());
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const payload = { id: user.id, name: user.name, role: user.role, class_id: user.class_id };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      reg_number: user.reg_number,
      role: user.role,
      class_id: user.class_id,
      photo_path: user.photo_path,
    },
  });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, reg_number, role, class_id, photo_path, phone, created_at FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) return res.status(404).json({ message: 'User not found' });

  // If student, include class name
  if (user.class_id) {
    const cls = db.prepare('SELECT name FROM classes WHERE id = ?').get(user.class_id);
    user.class_name = cls ? cls.name : null;
  }

  res.json(user);
});

module.exports = router;
