const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'joineazy_super_secret_jwt_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database connection & schema on server start
db.initDb();

// High Security Password Validator
function validateHighSecurityPassword(password) {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors = [];
  if (password.length < minLength) errors.push('Be at least 8 characters long');
  if (!hasUpper) errors.push('Include at least one uppercase letter (A-Z)');
  if (!hasLower) errors.push('Include at least one lowercase letter (a-z)');
  if (!hasNumber) errors.push('Include at least one number (0-9)');
  if (!hasSpecial) errors.push('Include at least one special character (!@#$%^&*)');

  return {
    isValid: errors.length === 0,
    errors,
    score: [password.length >= 8, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
  };
}

// JWT Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Admin Authorization Middleware
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
}

// Helper to format user response (excluding password hash)
function normalizeId(value) {
  if (value === null || value === undefined || value === '') return null;
  const trimmed = String(value).trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  return trimmed;
}

function idsMatch(a, b) {
  return String(a) === String(b);
}

function readAssignmentIdFromRequest(req) {
  const raw = req.params && req.params.id;
  const fromParams = Array.isArray(raw) ? raw[0] : raw;
  const path = String(req.path || req.url || '').split('?')[0];
  const match = path.match(/\/assignments\/([^/]+)/);
  const fromPath = match ? decodeURIComponent(match[1]) : null;
  const chosen =
    fromPath && (!fromParams || String(fromPath).length >= String(fromParams).length)
      ? fromPath
      : fromParams;
  return chosen == null ? '' : String(chosen).trim();
}

async function findAssignmentById(assignmentId) {
  const id = assignmentId == null ? '' : String(assignmentId).trim();
  if (!id) return null;
  try {
    const byId = await db.query(
      'SELECT * FROM assignments WHERE CAST(id AS TEXT) = CAST($1 AS TEXT)',
      [id]
    );
    if (byId.rows.length > 0) return byId.rows[0];
  } catch (err) {
    console.warn('Assignment lookup notice:', err.message);
  }
  const all = await db.query('SELECT * FROM assignments');
  return all.rows.find((row) => idsMatch(row.id, id)) || null;
}

function parseAssignedGroupIds(value) {
  if (!value) return [];
  let parsed = value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
  }
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
  }
  if (Array.isArray(parsed)) {
    return parsed.map(normalizeId).filter((x) => x !== null);
  }
  return [];
}

function assignmentTargetType(asgn) {
  const raw = asgn.assigned_to_type || asgn.assigned_to_type || asgn.target_type || 'all';
  return String(raw).toLowerCase() === 'groups' ? 'groups' : 'all';
}

function isOwnedByFaculty(asgn, userId) {
  return idsMatch(asgn.created_by, userId);
}

function isAssignedToStudent(asgn, studentGroupIds = []) {
  if (!asgn) return false;
  const targetType = assignmentTargetType(asgn);
  // If assigned to all students ('all'), it is assigned to this student
  if (targetType !== 'groups') return true;

  // If assigned to specific group(s), verify student belongs to at least one target group
  const targetIds = parseAssignedGroupIds(asgn.assigned_group_ids);
  if (!Array.isArray(targetIds) || targetIds.length === 0) return false;

  return targetIds.some((gId) => studentGroupIds.some((u) => idsMatch(u, gId)));
}

async function getAcceptedGroupIds(userId) {
  try {
    const membersRes = await db.query(
      `SELECT group_id FROM group_members
       WHERE CAST(user_id AS TEXT) = CAST($1 AS TEXT)
         AND (LOWER(status) = 'accepted' OR LOWER(role) = 'creator' OR LOWER(role) = 'admin')`,
      [userId]
    );
    const createdRes = await db.query(
      `SELECT id FROM groups WHERE CAST(created_by AS TEXT) = CAST($1 AS TEXT)`,
      [userId]
    );
    const allGroupIds = [
      ...membersRes.rows.map((g) => g.group_id),
      ...createdRes.rows.map((g) => g.id)
    ];
    return Array.from(new Set(allGroupIds.map(normalizeId).filter((x) => x !== null)));
  } catch (err) {
    console.error('Error fetching student group IDs:', err);
    return [];
  }
}

async function buildGroupAssignmentProgress(assignmentId, groupId) {
  const membersRes = await db.query(
    `SELECT gm.*, u.name as user_name, u.email as user_email, u.roll_number
     FROM group_members gm
     JOIN users u ON CAST(gm.user_id AS TEXT) = CAST(u.id AS TEXT)
     WHERE CAST(gm.group_id AS TEXT) = CAST($1 AS TEXT)`,
    [groupId]
  );
  const members = membersRes.rows.filter((m) => m.status === 'accepted' || m.role === 'creator');
  const memberIds = members.map((m) => String(m.user_id));
  const subsRes = await db.query(
    'SELECT * FROM assignment_submissions WHERE CAST(assignment_id AS TEXT) = CAST($1 AS TEXT)',
    [assignmentId]
  );
  const submittedIds = new Set(
    subsRes.rows
      .filter((s) => memberIds.includes(String(s.student_id)))
      .map((s) => String(s.student_id))
  );

  const memberProgress = members.map((m) => ({
    id: m.user_id,
    name: m.user_name || m.user_email,
    email: m.user_email,
    rollNumber: m.roll_number || null,
    submitted: submittedIds.has(String(m.user_id))
  }));
  const submittedCount = memberProgress.filter((m) => m.submitted).length;
  const memberCount = memberProgress.length;
  const percent = memberCount > 0 ? Math.round((submittedCount / memberCount) * 100) : 0;

  return {
    groupId,
    memberCount,
    submittedCount,
    percent,
    complete: memberCount > 0 && submittedCount === memberCount,
    members: memberProgress
  };
}

function formatUserResponse(user) {
  const rawRole = (user.role || 'student').toLowerCase();
  const role = (rawRole === 'admin' || rawRole === 'professor' || rawRole === 'teacher') ? 'admin' : 'student';
  const isTeacher = role === 'admin';
  const empId = user.employee_id || user.employeeId || user.roll_number || user.rollNumber || user.student_id || null;
  const isComplete = isTeacher
    ? Boolean(user.name && empId && (user.phone_number || user.phone))
    : Boolean(user.school && (user.class_name || user.class) && (user.roll_number || user.rollNumber || user.student_id) && user.name && (user.phone_number || user.phone));

  return {
    id: user.id,
    email: user.email,
    role,
    name: user.name || null,
    school: user.school || null,
    class: user.class_name || user.class || null,
    rollNumber: user.roll_number || user.rollNumber || user.student_id || null,
    employeeId: empId,
    phone: user.phone_number || user.phone || null,
    isProfileComplete: isComplete,
    createdAt: user.created_at
  };
}

// Routes

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Joineazy API Server', timestamp: new Date() });
});

// 2. Password Strength Check Endpoint (for real-time backend verification)
app.post('/api/auth/verify-password', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ isValid: false, errors: ['Password is required'] });
  const result = validateHighSecurityPassword(password);
  res.json(result);
});

// 3. Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // High Security Password Validation
    const passwordValidation = validateHighSecurityPassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: 'Password does not meet high-security requirements',
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Hash password with bcrypt (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRole = role === 'admin' ? 'admin' : 'student';

    // Insert user into database
    const insertResult = await db.query(
      'INSERT INTO users (email, password_hash, role, name, school, class_name, roll_number, phone_number, google_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [email.toLowerCase(), passwordHash, userRole, null, null, null, null, null, null]
    );

    const newUser = insertResult.rows[0];

    // Issue JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: formatUserResponse(newUser)
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// 4. Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Issue JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// 5. Google Sign In Endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name, googleId, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Google account email is required' });
    }

    // Check if user exists
    let result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    let user;

    if (result.rows.length === 0) {
      // Create user via Google
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);
      const userRole = role === 'admin' ? 'admin' : 'student';

      const insertResult = await db.query(
        'INSERT INTO users (email, password_hash, role, name, school, class_name, roll_number, phone_number, google_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [email.toLowerCase(), passwordHash, userRole, name || null, null, null, null, null, googleId || 'google-oauth']
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
    }

    // Issue JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google Sign-In successful!',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// 6. Get Current User Profile Endpoint
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: formatUserResponse(result.rows[0]) });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Failed to retrieve profile' });
  }
});

// 7. Update Student Details Onboarding Endpoint
app.put('/api/student/profile', authenticateToken, async (req, res) => {
  try {
    const { name, rollNumber, phone } = req.body;

    if (!name || !rollNumber || !phone) {
      return res.status(400).json({
        message: 'All fields are required: Name, Roll Number / Student ID, and Phone Number'
      });
    }

    // Phone validation (basic digit check)
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 7) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }

    const updateResult = await db.query(
      'UPDATE users SET name = $1, roll_number = $2, phone_number = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name.trim(), rollNumber.trim(), cleanPhone, req.user.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student account not found' });
    }

    const updatedUser = updateResult.rows[0];

    res.json({
      message: 'Student profile details updated successfully!',
      user: formatUserResponse(updatedUser)
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update student profile' });
  }
});

// 7b. Update Teacher Profile Endpoint (Name, Employee ID, Phone, Department)
app.put('/api/teacher/profile', authenticateToken, async (req, res) => {
  try {
    const { name, employeeId, phone, school } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const updateResult = await db.query(
      'UPDATE users SET name = $1, roll_number = $2, phone_number = $3, school = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name.trim(), employeeId.trim(), cleanPhone, school ? school.trim() : 'Joineazy Institute', req.user.id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Teacher account not found' });
    }

    const updatedUser = updateResult.rows[0];

    res.json({
      message: 'Teacher profile details updated successfully!',
      user: formatUserResponse(updatedUser)
    });
  } catch (error) {
    console.error('Update Teacher Profile Error:', error);
    res.status(500).json({ message: 'Failed to update teacher profile' });
  }
});

// 8. Admin: Get All Students Endpoint
app.get(['/api/admin/students', '/api/admin/students'], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE role = 'student' ORDER BY id DESC");
    const students = result.rows.map(formatUserResponse);
    res.json({ students, total: students.length });
  } catch (error) {
    console.error('Admin Fetch Error:', error);
    res.status(500).json({ message: 'Failed to fetch student directory' });
  }
});

// 9. Search Students Endpoint (Search by Roll Number, Name, Email)
app.get('/api/students/search', authenticateToken, async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q) {
      return res.json({ students: [] });
    }
    const searchPattern = `%${q}%`;
    const result = await db.query(
      "SELECT * FROM users WHERE role = 'student' AND (roll_number ILIKE $1 OR name ILIKE $1 OR email ILIKE $1)",
      [searchPattern]
    );
    const students = result.rows.map(formatUserResponse);
    res.json({ students });
  } catch (error) {
    console.error('Search Students Error:', error);
    res.status(500).json({ message: 'Failed to search students' });
  }
});

// 10. Create Group Endpoint
app.post('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const groupResult = await db.query(
      'INSERT INTO groups (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description ? description.trim() : '', req.user.id]
    );
    const group = groupResult.rows[0];

    // Add creator as group member
    await db.query(
      'INSERT INTO group_members (group_id, user_id, role, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [group.id, req.user.id, 'creator', 'accepted']
    );

    res.status(201).json({
      message: 'Group created successfully!',
      group
    });
  } catch (error) {
    console.error('Create Group Error:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

// 11. Get My Groups Endpoint
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT g.*, gm.role as user_role, gm.status as user_status 
       FROM groups g 
       JOIN group_members gm ON g.id = gm.group_id 
       WHERE gm.user_id = $1 
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );

    const groups = await Promise.all(
      result.rows.map(async (group) => {
        const membersResult = await db.query(
          `SELECT gm.*, u.name as user_name, u.email as user_email, u.roll_number, u.school, u.class_name 
           FROM group_members gm 
           JOIN users u ON gm.user_id = u.id 
           WHERE gm.group_id = $1`,
          [group.id]
        );

        let progressSummary = { overallPercent: 0, completeCount: 0, assignmentCount: 0 };
        try {
          const allAsgnRes = await db.query('SELECT * FROM assignments ORDER BY created_at DESC');
          const relevant = allAsgnRes.rows.filter((asgn) => {
            if (asgn.assigned_to_type !== 'groups') return true;
            const ids = parseAssignedGroupIds(asgn.assigned_group_ids);
            return ids.some((id) => idsMatch(id, group.id));
          });
          let memberSlots = 0;
          let submittedSlots = 0;
          let completeCount = 0;
          for (const asgn of relevant) {
            const progress = await buildGroupAssignmentProgress(asgn.id, group.id);
            memberSlots += progress.memberCount;
            submittedSlots += progress.submittedCount;
            if (progress.complete) completeCount += 1;
          }
          progressSummary = {
            overallPercent: memberSlots > 0 ? Math.round((submittedSlots / memberSlots) * 100) : 0,
            completeCount,
            assignmentCount: relevant.length
          };
        } catch (progressErr) {
          console.warn('Group list progress note:', progressErr.message);
        }

        return {
          ...group,
          members: membersResult.rows,
          progress: progressSummary
        };
      })
    );

    res.json({ groups });
  } catch (error) {
    console.error('Get Groups Error:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

// 12b. Group assignment progress (visual tracker for student groups)
app.get('/api/groups/:id/progress', authenticateToken, async (req, res) => {
  try {
    const groupId = String(req.params.id);
    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const memberCheck = await db.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );
    if (memberCheck.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const allAsgnRes = await db.query('SELECT * FROM assignments ORDER BY created_at DESC');
    const relevant = allAsgnRes.rows.filter((asgn) => {
      if (asgn.assigned_to_type !== 'groups') return true;
      const ids = parseAssignedGroupIds(asgn.assigned_group_ids);
      return ids.some((id) => idsMatch(id, groupId));
    });

    const assignments = [];
    for (const asgn of relevant) {
      const progress = await buildGroupAssignmentProgress(asgn.id, groupId);
      assignments.push({
        id: asgn.id,
        title: asgn.title,
        due_date: asgn.due_date,
        onedrive_link: asgn.onedrive_link,
        ...progress
      });
    }

    const totals = assignments.reduce(
      (acc, item) => {
        acc.memberSlots += item.memberCount;
        acc.submittedSlots += item.submittedCount;
        return acc;
      },
      { memberSlots: 0, submittedSlots: 0 }
    );
    const overallPercent = totals.memberSlots > 0
      ? Math.round((totals.submittedSlots / totals.memberSlots) * 100)
      : 0;

    res.json({
      group: groupResult.rows[0],
      overallPercent,
      completeCount: assignments.filter((a) => a.complete).length,
      assignmentCount: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Group Progress Error:', error);
    res.status(500).json({ message: 'Failed to fetch group progress' });
  }
});

// 12. Get Group Details Endpoint
app.get('/api/groups/:id', authenticateToken, async (req, res) => {
  try {
    const groupId = String(req.params.id);
    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const group = groupResult.rows[0];

    const membersResult = await db.query(
      `SELECT gm.*, u.name as user_name, u.email as user_email, u.roll_number, u.school, u.class_name 
       FROM group_members gm 
       JOIN users u ON gm.user_id = u.id 
       WHERE gm.group_id = $1`,
      [groupId]
    );

    res.json({
      group: {
        ...group,
        members: membersResult.rows
      }
    });
  } catch (error) {
    console.error('Get Group Details Error:', error);
    res.status(500).json({ message: 'Failed to fetch group details' });
  }
});

// 13. Invite Student to Group Endpoint (via Email or User ID)
app.post('/api/groups/:id/invite', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { email, userId, studentId, rollNumber, inviteeEmail, inviteeId } = req.body;
    const targetEmail = (email || inviteeEmail || '').trim();
    const targetUserId = userId || inviteeId;
    const targetStudentId = (studentId || rollNumber || '').toString().trim();

    if (!targetEmail && !targetUserId && !targetStudentId) {
      return res.status(400).json({ message: 'Student email or student ID (roll number / user ID) is required to invite a member' });
    }

    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    const group = groupResult.rows[0];

    // Find student by email, numeric user ID, or roll number / student ID
    let userResult = { rows: [] };
    if (targetEmail && targetEmail.includes('@')) {
      userResult = await db.query('SELECT * FROM users WHERE email = $1', [targetEmail.toLowerCase()]);
    }
    if (userResult.rows.length === 0 && (targetUserId || /^\d+$/.test(targetStudentId))) {
      const numericId = parseInt(targetUserId || targetStudentId, 10);
      if (!Number.isNaN(numericId)) {
        userResult = await db.query('SELECT * FROM users WHERE id = $1', [numericId]);
      }
    }
    if (userResult.rows.length === 0 && targetStudentId) {
      userResult = await db.query(
        "SELECT * FROM users WHERE role = 'student' AND (roll_number ILIKE $1 OR email ILIKE $1)",
        [`%${targetStudentId}%`]
      );
    }
    if (userResult.rows.length === 0 && targetEmail) {
      userResult = await db.query(
        "SELECT * FROM users WHERE role = 'student' AND (email ILIKE $1 OR roll_number ILIKE $1)",
        [`%${targetEmail}%`]
      );
    }

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student with the provided email or ID was not found' });
    }
    const targetUser = userResult.rows[0];

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ message: 'You are already in this group as creator' });
    }

    // Check existing membership
    const memberResult = await db.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUser.id]
    );

    if (memberResult.rows.length > 0) {
      const status = memberResult.rows[0].status;
      if (status === 'accepted') {
        return res.status(400).json({ message: `${targetUser.name || targetUser.email} is already a member of this group` });
      }
      if (status === 'pending') {
        return res.status(400).json({ message: `Invitation is already pending for ${targetUser.name || targetUser.email}` });
      }
      await db.query(
        "UPDATE group_members SET status = $1 WHERE group_id = $2 AND user_id = $3",
        ['pending', groupId, targetUser.id]
      );
    } else {
      await db.query(
        'INSERT INTO group_members (group_id, user_id, role, status) VALUES ($1, $2, $3, $4)',
        [groupId, targetUser.id, 'member', 'pending']
      );
    }

    // Get inviter details
    const inviterResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const inviter = inviterResult.rows[0] || {};
    const inviterName = inviter.name || inviter.email;

    // Send in-app notification to target user
    await db.query(
      'INSERT INTO notifications (user_id, sender_id, group_id, type, title, message, status, invitation_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        targetUser.id,
        req.user.id,
        groupId,
        'group_invite',
        'Group Invitation',
        `${inviterName} invited you to join "${group.name}".`,
        'unread',
        'pending'
      ]
    );

    res.json({
      message: `Invitation sent to ${targetUser.name || targetUser.email}! An in-app notification has been dispatched.`,
      invitedUser: formatUserResponse(targetUser)
    });
  } catch (error) {
    console.error('Invite Student Error:', error);
    res.status(500).json({ message: 'Failed to send group invitation' });
  }
});

// 14. Get Notifications Endpoint
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT n.*, u.name as sender_name, u.email as sender_email, g.name as group_name
       FROM notifications n
       LEFT JOIN users u ON CAST(n.sender_id AS TEXT) = CAST(u.id AS TEXT)
       LEFT JOIN groups g ON CAST(n.group_id AS TEXT) = CAST(g.id AS TEXT)
       WHERE CAST(n.user_id AS TEXT) = CAST($1 AS TEXT)
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );

    const unreadCount = result.rows.filter(n => n.status === 'unread').length;

    res.json({
      notifications: result.rows,
      unreadCount
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// 15. Mark All Notifications Read Endpoint
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await db.query("UPDATE notifications SET status = 'read' WHERE user_id = $1", [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark Read All Error:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
});

// 16. Mark Single Notification Read Endpoint
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    await db.query("UPDATE notifications SET status = 'read' WHERE id = $1 AND user_id = $2", [notifId, req.user.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// 17. Respond to Group Invitation Endpoint (Accept / Decline)
app.post('/api/notifications/:id/respond', authenticateToken, async (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accept or reject' });
    }

    const notifResult = await db.query('SELECT * FROM notifications WHERE id = $1 AND user_id = $2', [notifId, req.user.id]);
    if (notifResult.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const notification = notifResult.rows[0];
    if (notification.type !== 'group_invite') {
      return res.status(400).json({ message: 'This notification is not a group invitation' });
    }

    const groupId = notification.group_id;
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // Update group member status
    await db.query(
      'UPDATE group_members SET status = $1 WHERE group_id = $2 AND user_id = $3',
      [newStatus, groupId, req.user.id]
    );

    // Update notification status
    await db.query(
      'UPDATE notifications SET invitation_status = $1, status = $2 WHERE id = $3',
      [newStatus, 'read', notifId]
    );

    // Notify original sender (group creator/inviter)
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);

    const student = userResult.rows[0] || {};
    const group = groupResult.rows[0] || {};
    const studentName = student.name || student.email;

    if (notification.sender_id) {
      await db.query(
        'INSERT INTO notifications (user_id, sender_id, group_id, type, title, message, status, invitation_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          notification.sender_id,
          req.user.id,
          groupId,
          'invite_response',
          `Invitation ${action === 'accept' ? 'Accepted' : 'Declined'}`,
          `${studentName} has ${action === 'accept' ? 'accepted' : 'declined'} your invitation to join "${group.name || 'the group'}".`,
          'unread',
          'none'
        ]
      );
    }

    res.json({
      message: action === 'accept' ? 'Group invitation accepted!' : 'Group invitation declined.',
      invitation_status: newStatus
    });
  } catch (error) {
    console.error('Respond Invitation Error:', error);
    res.status(500).json({ message: 'Failed to process invitation response' });
  }
});

// 18. Professor/Admin: Create Assignment Endpoint
app.post('/api/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      onedriveLink,
      assignedToType,
      assignedGroupIds,
      questionPaperUrl,
      questionPaperName
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Assignment title is required' });
    }

    if (dueDate && new Date(dueDate).getTime() < Date.now() - 60000) {
      return res.status(400).json({ message: 'Assignment due date cannot be set in the past' });
    }

    const groupIdsJson = JSON.stringify(assignedGroupIds || []);
    const result = await db.query(
      'INSERT INTO assignments (title, description, due_date, onedrive_link, assigned_to_type, assigned_group_ids, created_by, question_paper_url, question_paper_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        title.trim(),
        description ? description.trim() : '',
        dueDate || null,
        onedriveLink ? onedriveLink.trim() : null,
        assignedToType === 'groups' ? 'groups' : 'all',
        groupIdsJson,
        req.user.id,
        questionPaperUrl ? String(questionPaperUrl).trim() : null,
        questionPaperName ? String(questionPaperName).trim() : null
      ]
    );

    const newAssignment = result.rows[0];

    // Notify target students
    try {
      let targetUserIds = [];
      if (assignedToType === 'groups' && Array.isArray(assignedGroupIds) && assignedGroupIds.length > 0) {
        for (const gId of assignedGroupIds) {
          const membersRes = await db.query(
            `SELECT user_id FROM group_members
             WHERE CAST(group_id AS TEXT) = CAST($1 AS TEXT)
               AND (status = 'accepted' OR role = 'creator')`,
            [gId]
          );
          membersRes.rows.forEach((m) => {
            if (!targetUserIds.some((id) => idsMatch(id, m.user_id))) targetUserIds.push(m.user_id);
          });
        }
      } else {
        const studentsRes = await db.query("SELECT id FROM users WHERE role = 'student'");
        targetUserIds = studentsRes.rows.map(s => s.id);
      }

      for (const uid of targetUserIds) {
        await db.query(
          'INSERT INTO notifications (user_id, sender_id, type, title, message, status, invitation_status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            uid,
            req.user.id,
            'assignment_notice',
            'New Coursework Assignment',
            `Professor posted a new assignment: "${newAssignment.title}". Check Coursework section.`,
            'unread',
            'none'
          ]
        );
      }
    } catch (notifErr) {
      console.error('Error sending assignment notifications:', notifErr);
    }

    res.status(201).json({
      message: 'Assignment created and published successfully!',
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Create Assignment Error:', error);
    res.status(500).json({ message: 'Failed to create assignment' });
  }
});

// 19. Get Assignments Endpoint (Role Aware with Teacher Name)
app.get('/api/assignments', authenticateToken, async (req, res) => {
  try {
    const allAssignmentsRes = await db.query('SELECT * FROM assignments ORDER BY created_at DESC');
    const assignments = allAssignmentsRes.rows;

    if (req.user.role === 'admin') {
      const mine = assignments.filter((asgn) => isOwnedByFaculty(asgn, req.user.id));
      const result = await Promise.all(
        mine.map(async (asgn) => {
          const subsRes = await db.query(
            'SELECT * FROM assignment_submissions WHERE CAST(assignment_id AS TEXT) = CAST($1 AS TEXT)',
            [asgn.id]
          );
          return {
            ...asgn,
            submissionCount: subsRes.rows.length,
            submissions: subsRes.rows
          };
        })
      );
      return res.json({ assignments: result });
    }

    const userGroupIds = await getAcceptedGroupIds(req.user.id);

    const filteredAssignments = await Promise.all(
      assignments
        .filter((asgn) => isAssignedToStudent(asgn, userGroupIds))
        .map(async (asgn) => {
          const teacherRes = await db.query('SELECT name, email FROM users WHERE id = $1', [asgn.created_by]);
          const teacher = teacherRes.rows[0] || {};
          const teacherName = teacher.name || teacher.email || 'Faculty Member';

          const subRes = await db.query(
            'SELECT * FROM assignment_submissions WHERE CAST(assignment_id AS TEXT) = CAST($1 AS TEXT) AND CAST(student_id AS TEXT) = CAST($2 AS TEXT)',
            [asgn.id, req.user.id]
          );
          const userSub = subRes.rows[0] || null;

          const assignedIds = parseAssignedGroupIds(asgn.assigned_group_ids);
          const progressGroupIds = asgn.assigned_to_type === 'groups'
            ? assignedIds.filter((gId) => userGroupIds.some((u) => idsMatch(u, gId)))
            : userGroupIds;

          const groupProgress = [];
          for (const gId of progressGroupIds) {
            const progress = await buildGroupAssignmentProgress(asgn.id, gId);
            const groupRow = await db.query('SELECT * FROM groups WHERE id = $1', [gId]);
            groupProgress.push({
              ...progress,
              groupName: groupRow.rows[0] ? groupRow.rows[0].name : `Group #${gId}`
            });
          }

          return {
            ...asgn,
            teacher_name: teacherName,
            isSubmitted: Boolean(userSub),
            submission: userSub,
            groupProgress
          };
        })
    );

    res.json({ assignments: filteredAssignments });
  } catch (error) {
    console.error('Get Assignments Error:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

// 20. Edit Assignment Endpoint (Admin/Professor)
app.put('/api/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const {
      title,
      description,
      dueDate,
      onedriveLink,
      assignedToType,
      assignedGroupIds,
      questionPaperUrl,
      questionPaperName
    } = req.body;

    if (dueDate && new Date(dueDate).getTime() < Date.now() - 60000) {
      return res.status(400).json({ message: 'Assignment due date cannot be set in the past' });
    }

    const groupIdsJson = JSON.stringify(assignedGroupIds || []);
    const existing = await findAssignmentById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (!isOwnedByFaculty(existing, req.user.id)) {
      return res.status(403).json({ message: 'You can only edit assignments you created' });
    }

    const result = await db.query(
      `UPDATE assignments
       SET title = $1, description = $2, due_date = $3, onedrive_link = $4, assigned_to_type = $5, assigned_group_ids = $6, question_paper_url = $7, question_paper_name = $8, updated_at = CURRENT_TIMESTAMP
       WHERE CAST(id AS TEXT) = CAST($9 AS TEXT) RETURNING *`,
      [
        title ? title.trim() : '',
        description ? description.trim() : '',
        dueDate || null,
        onedriveLink ? onedriveLink.trim() : null,
        assignedToType === 'groups' ? 'groups' : 'all',
        groupIdsJson,
        questionPaperUrl ? String(questionPaperUrl).trim() : null,
        questionPaperName ? String(questionPaperName).trim() : null,
        existing.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({
      message: 'Assignment updated successfully!',
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error('Edit Assignment Error:', error);
    res.status(500).json({ message: 'Failed to update assignment' });
  }
});

// 21. Delete Assignment Endpoint (Admin/Professor)
app.delete('/api/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await findAssignmentById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (!isOwnedByFaculty(existing, req.user.id)) {
      return res.status(403).json({ message: 'You can only delete assignments you created' });
    }
    await db.query('DELETE FROM assignments WHERE CAST(id AS TEXT) = CAST($1 AS TEXT)', [existing.id]);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete Assignment Error:', error);
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
});

// 22. Submit / Confirm Assignment Completion Endpoint (Student)
app.post('/api/assignments/:id/submit', authenticateToken, async (req, res) => {
  try {
    const assignmentId = readAssignmentIdFromRequest(req);
    const body = req.body || {};

    const assignment = await findAssignmentById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (req.user.role !== 'admin') {
      const studentGroupIds = await getAcceptedGroupIds(req.user.id);
      if (!isAssignedToStudent(assignment, studentGroupIds)) {
        return res.status(403).json({ message: 'This assignment was not given to you' });
      }
    }

    const resolvedId = assignment.id;
    const linkValue = String(body.submissionLink || body.submissionLink || '').trim() || null;
    const notesValue = String(body.submissionNotes || body.submissionNotes || '').trim() || null;
    const resolvedGroupId = body.groupId || null;

    const existingSub = await db.query(
      'SELECT * FROM assignment_submissions WHERE CAST(assignment_id AS TEXT) = CAST($1 AS TEXT) AND CAST(student_id AS TEXT) = CAST($2 AS TEXT)',
      [resolvedId, req.user.id]
    );

    let submission;

    if (existingSub.rows.length > 0) {
      const upd = await db.query(
        `UPDATE assignment_submissions
         SET group_id = $1, status = $2, submission_link = $3, submission_notes = $4, submitted_at = CURRENT_TIMESTAMP
         WHERE CAST(assignment_id AS TEXT) = CAST($5 AS TEXT) AND CAST(student_id AS TEXT) = CAST($6 AS TEXT) RETURNING *`,
        [resolvedGroupId || existingSub.rows[0].group_id, 'confirmed', linkValue, notesValue, resolvedId, req.user.id]
      );
      submission = upd.rows[0];
    } else {
      const subRes = await db.query(
        'INSERT INTO assignment_submissions (assignment_id, student_id, group_id, status, submission_link, submission_notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [resolvedId, req.user.id, resolvedGroupId, 'confirmed', linkValue, notesValue]
      );
      submission = subRes.rows[0];
    }

    // Notify Professor
    const studentRes = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const student = studentRes.rows[0] || {};

    try {
      await db.query(
        'INSERT INTO notifications (user_id, sender_id, group_id, type, title, message, status, invitation_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          assignment.created_by,
          req.user.id,
          resolvedGroupId,
          'submission_notice',
          'Work Submitted',
          `${student.name || student.email} confirmed completion for "${assignment.title}".`,
          'unread',
          'none'
        ]
      );
    } catch (notifyErr) {
      console.warn('Submission saved, but professor notification failed:', notifyErr.message);
    }

    res.json({
      message: 'Work submitted and confirmed successfully!',
      submission
    });
  } catch (error) {
    console.error('Submit Assignment Error:', error);
    res.status(500).json({ message: 'Failed to submit assignment' });
  }
});

// 23. Admin / Professor Analytics Endpoint (Teacher-Specific)
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const facultyUserId = String(req.user.id);

    const studentsRes = await db.query("SELECT * FROM users WHERE role = 'student'");
    const students = studentsRes.rows;

    const groupsRes = await db.query('SELECT * FROM groups');
    const groups = groupsRes.rows;

    // Filter assignments given ONLY by this specific teacher
    const asgnsRes = await db.query('SELECT * FROM assignments');
    const assignments = asgnsRes.rows.filter((asgn) => {
      const createdBy = String(asgn.created_by || '');
      return createdBy === facultyUserId || createdBy.toLowerCase() === facultyUserId.toLowerCase();
    });

    const subsRes = await db.query('SELECT * FROM assignment_submissions');
    const myAssignmentIds = new Set(assignments.map((a) => String(a.id)));
    const submissions = subsRes.rows.filter((s) => myAssignmentIds.has(String(s.assignment_id)));

    // Populate student name/email and assignment title on recent submissions
    const recentSubmissions = await Promise.all(
      submissions.slice(0, 30).map(async (sub) => {
        const studentRes = await db.query('SELECT name, email, roll_number FROM users WHERE id = $1', [sub.student_id]);
        const asgn = assignments.find((a) => String(a.id) === String(sub.assignment_id));
        const student = studentRes.rows[0] || {};
        return {
          ...sub,
          student_name: student.name || student.email || 'Student',
          student_email: student.email || '',
          roll_number: student.roll_number || sub.roll_number || null,
          assignment_title: asgn ? asgn.title : 'Coursework Assignment',
          submitted_at: sub.submitted_at || sub.created_at
        };
      })
    );

    // Per-Assignment / Per-Project analytics breakdown for this faculty member
    const assignmentPerformance = await Promise.all(
      assignments.map(async (asgn) => {
        const asgnSubs = submissions.filter((s) => idsMatch(s.assignment_id, asgn.id));
        const assignedGroupIds = parseAssignedGroupIds(asgn.assigned_group_ids);

        // Determine target groups for this assignment
        const targetGroups = asgn.assigned_to_type === 'groups' && assignedGroupIds.length > 0
          ? groups.filter((g) => assignedGroupIds.some((id) => idsMatch(g.id, id)))
          : groups;

        // Group breakdown for this specific project/assignment
        const groupBreakdown = await Promise.all(
          targetGroups.map(async (group) => {
            const membersRes = await db.query(
              "SELECT * FROM group_members WHERE group_id = $1 AND (LOWER(status) = 'accepted' OR LOWER(role) = 'creator')",
              [group.id]
            );
            const memberCount = membersRes.rows.length;
            const groupSubs = asgnSubs.filter((s) => idsMatch(s.group_id, group.id));
            const subCount = groupSubs.length;
            const rate = memberCount > 0 ? Math.round((subCount / memberCount) * 100) : (subCount > 0 ? 100 : 0);
            return {
              groupId: group.id,
              groupName: group.name,
              memberCount,
              submissionCount: subCount,
              completionRate: Math.min(rate, 100)
            };
          })
        );

        const totalSubmitted = asgnSubs.length;
        const totalTargetGroups = targetGroups.length;
        const totalTargetStudents = groupBreakdown.reduce((acc, gb) => acc + gb.memberCount, 0);

        const overallProjectRate = totalTargetStudents > 0
          ? Math.round((totalSubmitted / totalTargetStudents) * 100)
          : (totalSubmitted > 0 ? 100 : 0);

        return {
          id: asgn.id,
          title: asgn.title,
          description: asgn.description,
          assignedToType: asgn.assigned_to_type,
          dueDate: asgn.due_date,
          onedriveLink: asgn.onedrive_link,
          totalSubmitted,
          totalTargetGroups,
          totalTargetStudents,
          overallProjectRate: Math.min(overallProjectRate, 100),
          groupBreakdown
        };
      })
    );

    // Calculate group performance breakdown strictly for this teacher's assignments
    const groupPerformance = await Promise.all(
      groups.map(async (group) => {
        const membersRes = await db.query('SELECT * FROM group_members WHERE group_id = $1 AND status = \'accepted\'', [group.id]);
        const memberCount = membersRes.rows.length;
        const groupSubmissions = submissions.filter((s) => String(s.group_id) === String(group.id));

        return {
          id: group.id,
          name: group.name,
          memberCount,
          submissionCount: groupSubmissions.length,
          completionRate:
            memberCount > 0 && assignments.length > 0
              ? Math.round((groupSubmissions.length / (memberCount * assignments.length)) * 100)
              : groupSubmissions.length > 0
              ? 100
              : 0
        };
      })
    );

    const totalExpectedSubmissions = students.length * assignments.length;
    const overallCompletionRate =
      totalExpectedSubmissions > 0
        ? Math.round((submissions.length / totalExpectedSubmissions) * 100)
        : submissions.length > 0
        ? 100
        : 0;

    res.json({
      summary: {
        totalStudents: students.length,
        totalGroups: groups.length,
        totalAssignments: assignments.length,
        totalSubmissions: submissions.length,
        overallCompletionRate
      },
      assignmentPerformance,
      groupPerformance,
      recentSubmissions
    });
  } catch (error) {
    console.error('Fetch Analytics Error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Export Express App for Vercel Serverless Function & local start
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Joineazy Server running on port ${PORT}`);
    console.log(`🔒 JWT Authentication & Security active`);
    console.log(`=================================`);
  });
}

module.exports = app;
