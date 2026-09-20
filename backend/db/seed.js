const bcrypt = require('bcryptjs');
const db = require('./database');

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

function seed() {
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
  if (adminExists) {
    console.log('⚠️  Database already seeded. Skipping...');
    return;
  }

  const hash = (pwd) => bcrypt.hashSync(pwd, 10);

  // --- Classes ---
  const classNames = ['JSS 1A', 'JSS 2A', 'JSS 3A', 'SS 1A', 'SS 2A', 'SS 3A'];
  const classIds = {};
  classNames.forEach((name) => {
    const res = db.prepare('INSERT INTO classes (name) VALUES (?)').run(name);
    classIds[name] = res.lastInsertRowid;
  });

  // --- Admin ---
  db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run('School Administrator', 'admin@school.com', hash('admin123'), 'admin');

  // --- Teachers ---
  const t1 = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run('Mr. John Smith', 'john.smith@school.com', hash('teacher123'), 'teacher');

  const t2 = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run('Mrs. Mary Johnson', 'mary.johnson@school.com', hash('teacher123'), 'teacher');

  const t3 = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run('Mr. James Okafor', 'james.okafor@school.com', hash('teacher123'), 'teacher');

  // --- Subjects per class ---
  const subjectDefs = {
    'JSS 1A': ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'CRS / Islamic Studies'],
    'JSS 2A': ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Agricultural Science', 'Computer Studies'],
    'JSS 3A': ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'Business Studies'],
    'SS 1A':  ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government'],
    'SS 2A':  ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Literature'],
    'SS 3A':  ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government'],
  };

  const subjectIds = {};
  for (const [cls, subs] of Object.entries(subjectDefs)) {
    subjectIds[cls] = [];
    subs.forEach((name) => {
      const res = db
        .prepare('INSERT OR IGNORE INTO subjects (name, class_id) VALUES (?, ?)')
        .run(name, classIds[cls]);
      if (res.lastInsertRowid) subjectIds[cls].push(res.lastInsertRowid);
    });
  }

  // --- Sessions ---
  const sess = [
    { year: '2023/2024', term: '1st' },
    { year: '2023/2024', term: '2nd' },
    { year: '2023/2024', term: '3rd' },
    { year: '2024/2025', term: '1st' },
    { year: '2024/2025', term: '2nd' },
    { year: '2025/2026', term: '1st', is_active: 1 },
  ];
  const sessionIds = sess.map((s) => {
    const res = db
      .prepare('INSERT OR IGNORE INTO sessions (year, term, is_active) VALUES (?, ?, ?)')
      .run(s.year, s.term, s.is_active || 0);
    return res.lastInsertRowid;
  });

  // --- Students ---
  const studentDefs = [
    { name: 'Alice Johnson',    reg: 'STU001', cls: 'JSS 1A' },
    { name: 'Bob Williams',     reg: 'STU002', cls: 'JSS 1A' },
    { name: 'Carol Brown',      reg: 'STU003', cls: 'JSS 2A' },
    { name: 'David Wilson',     reg: 'STU004', cls: 'JSS 2A' },
    { name: 'Eve Davis',        reg: 'STU005', cls: 'SS 1A'  },
    { name: 'Frank Miller',     reg: 'STU006', cls: 'SS 1A'  },
    { name: 'Grace Taylor',     reg: 'STU007', cls: 'JSS 3A' },
    { name: 'Henry Anderson',   reg: 'STU008', cls: 'SS 2A'  },
    { name: 'Iris Thomas',      reg: 'STU009', cls: 'SS 3A'  },
    { name: 'Jack Jackson',     reg: 'STU010', cls: 'JSS 1A' },
  ];

  const studentEntries = studentDefs.map((s) => {
    const res = db
      .prepare(
        'INSERT INTO users (name, reg_number, password_hash, role, class_id) VALUES (?, ?, ?, ?, ?)'
      )
      .run(s.name, s.reg, hash('student123'), 'student', classIds[s.cls]);
    return { id: res.lastInsertRowid, cls: s.cls };
  });

  // --- Results (sample data for past sessions) ---
  const pastSessionIds = sessionIds.slice(0, 5); // First 5 sessions get results

  studentEntries.forEach(({ id, cls }) => {
    const subs = subjectIds[cls] || [];
    pastSessionIds.forEach((sessionId) => {
      if (!sessionId) return;
      subs.forEach((subjectId) => {
        const ca   = Math.round(Math.random() * 28 + 2);   // 2–30
        const exam = Math.round(Math.random() * 60 + 10);  // 10–70
        const total = ca + exam;
        const { grade, remark } = getGrade(total);
        db.prepare(`
          INSERT OR IGNORE INTO results
            (student_id, subject_id, session_id, ca_score, exam_score, grade, remark, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, subjectId, sessionId, ca, exam, grade, remark, t1.lastInsertRowid);
      });
    });
  });

  console.log('\n✅ Database seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 ADMIN    : admin@school.com       / admin123');
  console.log('👩‍🏫 TEACHER  : john.smith@school.com  / teacher123');
  console.log('🎓 STUDENT  : STU001                 / student123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed();
