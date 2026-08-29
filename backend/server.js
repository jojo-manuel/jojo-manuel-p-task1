const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'joineazy_super_secret_jwt_key_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '448067617911-7q1pc33opl9bgbafh7mggqoo4vpjqio3.apps.googleusercontent.com';
const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleIdToken(idToken) {
  const ticket = await googleAuthClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error('Google account did not return an email address');
  }
  return {
    email: String(payload.email).toLowerCase(),
    name: payload.name || '',
    googleId: payload.sub,
    emailVerified: Boolean(payload.email_verified)
  };
}

async function issueAuthResponse(user, message, status = 200) {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'student' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    status,
    body: {
      message,
      isNewUser: false,
      token,
      user: formatUserResponse(user)
    }
  };
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  const groupHasSubmission = subsRes.rows.some((s) => String(s.group_id) === String(groupId));
  const individualSubmittedIds = new Set(
    subsRes.rows
      .filter((s) => memberIds.includes(String(s.student_id)))
      .map((s) => String(s.student_id))
  );

  const memberProgress = members.map((m) => ({
    id: m.user_id,
    name: m.user_name || m.user_email,
    email: m.user_email,
    rollNumber: m.roll_number || null,
    role: m.role,
    submitted: groupHasSubmission || individualSubmittedIds.has(String(m.user_id))
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
    : Boolean(user.name && (user.roll_number || user.rollNumber || user.student_id) && (user.phone_number || user.phone));

  return {
    id: user.id,
    email: user.email,
    role,
    name: user.name || null,
    rollNumber: user.roll_number || user.rollNumber || user.student_id || null,
    employeeId: empId,
    phone: user.phone_number || user.phone || null,
    school: user.school || null,
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
    res.status(500).json({ message: error.message || 'Internal server error during registration' });
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
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Google sign-in token is required' });
    }

    let profile;
    try {
      profile = await verifyGoogleIdToken(idToken);
    } catch (err) {
      console.error('Google token verification failed:', err.message);
      return res.status(401).json({
        message: 'Google sign-in could not be verified. Add this site as an Authorized JavaScript origin in Google Cloud Console.'
      });
    }

    if (!profile.emailVerified) {
      return res.status(400).json({ message: 'Please use a verified Google account' });
    }

    let result = await db.query('SELECT * FROM users WHERE email = $1', [profile.email]);
    if (result.rows.length === 0) {
      result = await db.query('SELECT * FROM users WHERE google_id = $1', [profile.googleId]);
    }

    if (result.rows.length === 0) {
      if (!role) {
        return res.json({
          isNewUser: true,
          profile: {
            email: profile.email,
            name: profile.name
          }
        });
      }

      const userRole = role === 'admin' ? 'admin' : 'student';
      const randomPassword = `${Math.random().toString(36).slice(-10)}A1!`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const insertResult = await db.query(
        'INSERT INTO users (email, password_hash, role, name, school, class_name, roll_number, phone_number, google_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [profile.email, passwordHash, userRole, profile.name || null, null, null, null, null, profile.googleId]
      );

      const created = await issueAuthResponse(insertResult.rows[0], 'Google registration successful!', 201);
      return res.status(created.status).json(created.body);
    }

    const user = result.rows[0];
    if (!user.google_id) {
      await db.query(
        'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *',
        [profile.googleId, user.id]
      );
      user.google_id = profile.googleId;
    }

    const signedIn = await issueAuthResponse(user, 'Google Sign-In successful!');
    return res.status(signedIn.status).json(signedIn.body);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: error.message || 'Google authentication failed' });
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

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!rollNumber || !String(rollNumber).trim()) {
      return res.status(400).json({ message: 'Roll Number / Student ID is required' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const cleanPhone = String(phone).trim();

    const updateResult = await db.query(
      'UPDATE users SET name = $1, roll_number = $2, phone_number = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [String(name).trim(), String(rollNumber).trim(), cleanPhone, req.user.id]
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

// 13b. Remove Member from Group Handler (Leader, Admin, or Self-Leave)
const handleRemoveGroupMember = async (req, res) => {
  try {
    const groupId = String(req.params.id || req.params.groupId || '');
    const targetUserId = String(req.params.userId || (req.body && req.body.userId) || '');

    if (!groupId || !targetUserId) {
      return res.status(400).json({ message: 'Group ID and User ID are required' });
    }

    const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    const group = groupResult.rows[0];

    // Find caller's role in this group
    const callerMemberRes = await db.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );
    const callerMember = callerMemberRes.rows[0];
    const isCallerLeader = idsMatch(group.creator_id, req.user.id) || (callerMember && (callerMember.role === 'creator' || callerMember.role === 'leader'));
    const isCallerAdmin = req.user.role === 'admin';
    const isSelfLeaving = idsMatch(req.user.id, targetUserId);

    if (!isCallerLeader && !isCallerAdmin && !isSelfLeaving) {
      return res.status(403).json({ message: 'Only the Group Leader or Admin can remove members from this group' });
    }

    // Check target member
    const targetMemberRes = await db.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );

    if (targetMemberRes.rows.length === 0) {
      return res.status(404).json({ message: 'Student is not a member of this group' });
    }
    const targetMember = targetMemberRes.rows[0];

    // Creator cannot be removed (group must be deleted or ownership transferred)
    if (idsMatch(group.creator_id, targetUserId) && !isCallerAdmin) {
      return res.status(400).json({ message: 'The Group Creator cannot be removed from the group' });
    }

    // Delete member record
    await db.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );

    // If removed by leader/admin, send an in-app notice to the removed user
    if (!isSelfLeaving) {
      const actorRes = await db.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
      const actorName = (actorRes.rows[0] && (actorRes.rows[0].name || actorRes.rows[0].email)) || 'Group Leader';
      try {
        await db.query(
          'INSERT INTO notifications (user_id, sender_id, group_id, type, title, message, status, invitation_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [
            targetUserId,
            req.user.id,
            groupId,
            'group_notice',
            'Removed from Group',
            `You were removed from "${group.name}" by ${actorName}.`,
            'unread',
            'none'
          ]
        );
      } catch (notifyErr) {
        console.error('Error sending removal notice:', notifyErr);
      }
    }

    // Fetch updated members list
    const updatedMembersRes = await db.query(
      'SELECT * FROM group_members WHERE group_id = $1',
      [groupId]
    );

    const userRes = await db.query('SELECT id, name, email, roll_number FROM users');
    const allUsers = userRes.rows;
    const populatedMembers = updatedMembersRes.rows.map((m) => {
      const u = allUsers.find((user) => idsMatch(user.id, m.user_id)) || {};
      return {
        ...m,
        user_name: u.name || u.email,
        user_email: u.email,
        roll_number: u.roll_number
      };
    });

    res.json({
      message: isSelfLeaving
        ? `You left the group "${group.name}" successfully.`
        : `${targetMember.user_name || targetMember.user_email || 'Student'} was removed from "${group.name}".`,
      members: populatedMembers
    });
  } catch (error) {
    console.error('Remove Group Member Error:', error);
    res.status(500).json({ message: 'Failed to remove member from group' });
  }
};

app.delete('/api/groups/:id/members/:userId', authenticateToken, handleRemoveGroupMember);
app.post('/api/groups/:id/members/:userId/remove', authenticateToken, handleRemoveGroupMember);
app.post('/api/groups/:id/remove-member', authenticateToken, handleRemoveGroupMember);

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
      courseName,
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
    const resolvedCourseName = courseName && courseName.trim() ? courseName.trim() : 'General Coursework';

    const result = await db.query(
      'INSERT INTO assignments (title, description, course_name, due_date, onedrive_link, assigned_to_type, assigned_group_ids, created_by, question_paper_url, question_paper_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [
        title.trim(),
        description ? description.trim() : '',
        resolvedCourseName,
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
            `Professor posted a new assignment in "${resolvedCourseName}": "${newAssignment.title}".`,
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

          let userGroupRole = 'individual';
          let groupLeaderName = null;
          let groupName = null;
          let targetGroupId = null;

          if (asgn.assigned_to_type === 'groups') {
            const assignedIds = parseAssignedGroupIds(asgn.assigned_group_ids);
            targetGroupId = assignedIds.find((gId) => userGroupIds.some((u) => idsMatch(u, gId))) || userGroupIds[0] || null;

            if (targetGroupId) {
              const groupRes = await db.query('SELECT * FROM groups WHERE id = $1', [targetGroupId]);
              if (groupRes.rows[0]) groupName = groupRes.rows[0].name;

              // Check user role in group
              const myMemberRes = await db.query(
                "SELECT * FROM group_members WHERE CAST(group_id AS TEXT) = CAST($1 AS TEXT) AND CAST(user_id AS TEXT) = CAST($2 AS TEXT) AND (status = 'accepted' OR role = 'creator')",
                [targetGroupId, req.user.id]
              );
              const myRole = myMemberRes.rows[0] ? (myMemberRes.rows[0].role || 'member') : 'member';
              userGroupRole = (myRole === 'creator' || myRole === 'leader') ? 'leader' : 'member';

              // Find group leader user name
              const leaderRes = await db.query(
                "SELECT u.name, u.email FROM group_members gm JOIN users u ON CAST(u.id AS TEXT) = CAST(gm.user_id AS TEXT) WHERE CAST(gm.group_id AS TEXT) = CAST($1 AS TEXT) AND (gm.role = 'creator' OR gm.role = 'leader') LIMIT 1",
                [targetGroupId]
              );
              if (leaderRes.rows[0]) {
                groupLeaderName = leaderRes.rows[0].name || leaderRes.rows[0].email;
              }
            }
          }

          const subRes = await db.query(
            'SELECT * FROM assignment_submissions WHERE CAST(assignment_id AS TEXT) = CAST($1 AS TEXT) AND CAST(student_id AS TEXT) = CAST($2 AS TEXT)',
            [asgn.id, req.user.id]
          );
          let userSub = subRes.rows[0] || null;

          if (!userSub && targetGroupId) {
            const groupSubRes = await db.query(
              'SELECT * FROM assignment_submissions WHERE CAST(assignment_id AS TEXT) = CAST($1 AS TEXT) AND CAST(group_id AS TEXT) = CAST($2 AS TEXT) LIMIT 1',
              [asgn.id, targetGroupId]
            );
            if (groupSubRes.rows[0]) {
              userSub = groupSubRes.rows[0];
            }
          }

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
            submissionType: asgn.assigned_to_type === 'groups' ? 'Group Assignment' : 'Individual Assignment',
            userGroupRole,
            groupLeaderName,
            groupName,
            targetGroupId,
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
    const linkValue = String(body.submissionLink || '').trim() || null;
    const notesValue = String(body.submissionNotes || '').trim() || null;
    const userGroupIds = await getAcceptedGroupIds(req.user.id);
    const assignedGroupIds = parseAssignedGroupIds(assignment.assigned_group_ids);
    const resolvedGroupId = body.groupId || assignedGroupIds.find((gId) => userGroupIds.some((u) => idsMatch(u, gId))) || userGroupIds[0] || null;

    // Group Leader enforcement for group assignments
    if (assignment.assigned_to_type === 'groups') {
      if (!resolvedGroupId) {
        return res.status(400).json({ message: 'You must belong to a target study group to submit this assignment.' });
      }

      // Query student's role in the group
      const myMemberRes = await db.query(
        `SELECT gm.*, g.name as group_name FROM group_members gm
         JOIN groups g ON CAST(g.id AS TEXT) = CAST(gm.group_id AS TEXT)
         WHERE CAST(gm.group_id AS TEXT) = CAST($1 AS TEXT)
           AND CAST(gm.user_id AS TEXT) = CAST($2 AS TEXT)
           AND (gm.status = 'accepted' OR gm.role = 'creator')`,
        [resolvedGroupId, req.user.id]
      );

      const memberRow = myMemberRes.rows[0];
      const isLeader = memberRow && (memberRow.role === 'creator' || memberRow.role === 'leader');

      if (!isLeader) {
        // Fetch leader name for friendly error message
        const leaderRes = await db.query(
          `SELECT u.name, u.email FROM group_members gm
           JOIN users u ON CAST(u.id AS TEXT) = CAST(gm.user_id AS TEXT)
           WHERE CAST(gm.group_id AS TEXT) = CAST($1 AS TEXT)
             AND (gm.role = 'creator' OR gm.role = 'leader') LIMIT 1`,
          [resolvedGroupId]
        );
        const leaderName = (leaderRes.rows[0] && (leaderRes.rows[0].name || leaderRes.rows[0].email)) || 'Group Leader';
        const groupName = (memberRow && memberRow.group_name) || 'this study group';

        return res.status(403).json({
          message: `Only the Group Leader (${leaderName}) of "${groupName}" can confirm submission for group assignments.`
        });
      }
    }

    // Process submission for student (and for all group members if group assignment)
    let targetStudentIds = [req.user.id];
    if (assignment.assigned_to_type === 'groups' && resolvedGroupId) {
      const allMembersRes = await db.query(
        `SELECT user_id FROM group_members
         WHERE CAST(group_id AS TEXT) = CAST($1 AS TEXT)
           AND (status = 'accepted' OR role = 'creator')`,
        [resolvedGroupId]
      );
      targetStudentIds = allMembersRes.rows.map(m => m.user_id);
      if (!targetStudentIds.some(id => idsMatch(id, req.user.id))) {
        targetStudentIds.push(req.user.id);
      }
    }

    let primarySubmission;
    for (const sid of targetStudentIds) {
      const existingSub = await db.query(
        'SELECT * FROM assignment_submissions WHERE CAST(assignment_id AS TEXT) = CAST($1 AS TEXT) AND CAST(student_id AS TEXT) = CAST($2 AS TEXT)',
        [resolvedId, sid]
      );

      if (existingSub.rows.length > 0) {
        const upd = await db.query(
          `UPDATE assignment_submissions
           SET group_id = $1, status = $2, submission_link = $3, submission_notes = $4, submitted_at = CURRENT_TIMESTAMP
           WHERE CAST(assignment_id AS TEXT) = CAST($5 AS TEXT) AND CAST(student_id AS TEXT) = CAST($6 AS TEXT) RETURNING *`,
          [resolvedGroupId || existingSub.rows[0].group_id, 'confirmed', linkValue, notesValue, resolvedId, sid]
        );
        if (idsMatch(sid, req.user.id)) primarySubmission = upd.rows[0];
      } else {
        const subRes = await db.query(
          'INSERT INTO assignment_submissions (assignment_id, student_id, group_id, status, submission_link, submission_notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [resolvedId, sid, resolvedGroupId, 'confirmed', linkValue, notesValue]
        );
        if (idsMatch(sid, req.user.id)) primarySubmission = subRes.rows[0];
      }
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
          `${student.name || student.email} (Group Leader) confirmed completion for "${assignment.title}".`,
          'unread',
          'none'
        ]
      );

      // Notify group members if group assignment
      if (assignment.assigned_to_type === 'groups' && targetStudentIds.length > 1) {
        for (const sid of targetStudentIds) {
          if (!idsMatch(sid, req.user.id)) {
            await db.query(
              'INSERT INTO notifications (user_id, sender_id, group_id, type, title, message, status, invitation_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
              [
                sid,
                req.user.id,
                resolvedGroupId,
                'submission_notice',
                'Group Assignment Submitted',
                `Your Group Leader (${student.name || student.email}) confirmed submission for "${assignment.title}".`,
                'unread',
                'none'
              ]
            );
          }
        }
      }
    } catch (notifyErr) {
      console.error('Error sending submission notification:', notifyErr);
    }

    res.json({
      message: 'Work submitted and confirmed successfully!',
      submission: primarySubmission
    });
  } catch (error) {
    console.error('Submit Assignment Error:', error);
    res.status(500).json({ message: 'Failed to submit assignment' });
  }
});

// 22b. Grade Assignment Submission Endpoint (Teacher / Admin)
app.put('/api/assignments/submissions/:id/grade', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { grade, feedback, status } = req.body || {};

    const updated = await db.query(
      `UPDATE assignment_submissions
       SET grade = $1, feedback = $2, status = $3, graded_at = CURRENT_TIMESTAMP
       WHERE CAST(id AS TEXT) = CAST($4 AS TEXT) RETURNING *`,
      [grade || null, feedback || null, status || 'graded', submissionId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const sub = updated.rows[0];

    // Notify Student
    try {
      const asgnRes = await db.query('SELECT title FROM assignments WHERE id = $1', [sub.assignment_id]);
      const asgnTitle = asgnRes.rows[0] ? asgnRes.rows[0].title : 'Assignment';
      await db.query(
        'INSERT INTO notifications (user_id, sender_id, group_id, type, title, message, status, invitation_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          sub.student_id,
          req.user.id,
          sub.group_id,
          'grade_notice',
          'Assignment Graded',
          `Your submission for "${asgnTitle}" has been graded: ${grade || 'Reviewed'}.`,
          'unread',
          'none'
        ]
      );
    } catch (nErr) {
      console.warn('Graded submission, notification warning:', nErr.message);
    }

    res.json({ message: 'Submission graded successfully', submission: sub });
  } catch (error) {
    console.error('Grade Submission Error:', error);
    res.status(500).json({ message: 'Failed to grade submission' });
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

    // Construct global student-to-group map across all groups
    const globalStudentGroupMap = {};
    for (const g of groups) {
      const gMemRes = await db.query(
        "SELECT user_id FROM group_members WHERE group_id = $1 AND (LOWER(status) = 'accepted' OR LOWER(role) = 'creator')",
        [g.id]
      );
      gMemRes.rows.forEach((m) => {
        globalStudentGroupMap[String(m.user_id)] = g.name;
      });
    }

    // Populate student name/email, group name, and assignment title on recent submissions
    const recentSubmissions = await Promise.all(
      submissions.slice(0, 30).map(async (sub) => {
        const studentRes = await db.query('SELECT name, email, roll_number FROM users WHERE id = $1', [sub.student_id]);
        const asgn = assignments.find((a) => String(a.id) === String(sub.assignment_id));
        const student = studentRes.rows[0] || {};
        const matchedGroup = groups.find((g) => idsMatch(g.id, sub.group_id));
        return {
          ...sub,
          student_name: student.name || student.email || 'Student',
          student_email: student.email || '',
          roll_number: student.roll_number || sub.roll_number || null,
          group_name: matchedGroup ? matchedGroup.name : (globalStudentGroupMap[String(sub.student_id)] || null),
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
        const isGroupTarget = asgn.assigned_to_type === 'groups' && assignedGroupIds.length > 0;

        // Determine target groups for this assignment
        const targetGroups = isGroupTarget
          ? groups.filter((g) => assignedGroupIds.some((id) => idsMatch(g.id, id)))
          : groups;

        // Group breakdown for this specific project/assignment
        const groupMembersMap = {};
        const groupBreakdown = await Promise.all(
          targetGroups.map(async (group) => {
            const membersRes = await db.query(
              "SELECT * FROM group_members WHERE group_id = $1 AND (LOWER(status) = 'accepted' OR LOWER(role) = 'creator')",
              [group.id]
            );
            const memberRows = membersRes.rows;
            const groupMembers = memberRows.map((gm) => {
              const matchedStudent = students.find((st) => idsMatch(st.id, gm.user_id)) || {};
              const sub = asgnSubs.find((s) => idsMatch(s.student_id, gm.user_id));
              return {
                userId: gm.user_id,
                name: matchedStudent.name || matchedStudent.email || 'Student',
                email: matchedStudent.email || '',
                rollNumber: matchedStudent.roll_number || null,
                phone: matchedStudent.phone || null,
                school: matchedStudent.school || null,
                role: gm.role,
                submitted: Boolean(sub),
                submittedAt: sub ? (sub.submitted_at || sub.created_at) : null,
                grade: sub ? sub.grade : null,
                feedback: sub ? sub.feedback : null,
                submissionLink: sub ? sub.submission_link : null,
                submissionNotes: sub ? sub.submission_notes : null
              };
            });

            groupMembers.forEach((m) => {
              groupMembersMap[String(m.userId)] = group.name;
            });

            const memberCount = groupMembers.length;
            const subCount = groupMembers.filter((m) => m.submitted).length;
            const rate = memberCount > 0 ? Math.round((subCount / memberCount) * 100) : (subCount > 0 ? 100 : 0);
            return {
              groupId: group.id,
              groupName: group.name,
              memberCount,
              submissionCount: subCount,
              completionRate: Math.min(rate, 100),
              members: groupMembers
            };
          })
        );

        // Determine target students
        let targetStudentList = [];
        if (isGroupTarget) {
          const uniqueTargetUserIds = new Set();
          groupBreakdown.forEach((gb) => {
            gb.members.forEach((m) => {
              if (!uniqueTargetUserIds.has(String(m.userId))) {
                uniqueTargetUserIds.add(String(m.userId));
                targetStudentList.push(m);
              }
            });
          });
        } else {
          targetStudentList = students.map((s) => ({
            userId: s.id,
            name: s.name || s.email,
            email: s.email,
            rollNumber: s.roll_number,
            phone: s.phone,
            school: s.school,
            class: s.class
          }));
        }

        // Build list of submitted students
        const submittedStudents = asgnSubs.map((sub) => {
          const matchedStudent = students.find((s) => idsMatch(s.id, sub.student_id)) || {};
          const matchedGroup = groups.find((g) => idsMatch(g.id, sub.group_id));
          const resolvedGroupName = matchedGroup ? matchedGroup.name : (groupMembersMap[String(sub.student_id)] || globalStudentGroupMap[String(sub.student_id)] || null);
          return {
            id: sub.id,
            submissionId: sub.id,
            assignmentId: asgn.id,
            studentId: sub.student_id,
            studentName: matchedStudent.name || sub.student_name || matchedStudent.email || 'Student',
            studentEmail: matchedStudent.email || sub.student_email || '',
            rollNumber: matchedStudent.roll_number || sub.roll_number || null,
            phone: matchedStudent.phone || null,
            school: matchedStudent.school || null,
            groupName: resolvedGroupName,
            submittedAt: sub.submitted_at || sub.created_at,
            submissionLink: sub.submission_link,
            submissionNotes: sub.submission_notes,
            grade: sub.grade || null,
            feedback: sub.feedback || null,
            gradedAt: sub.graded_at || null
          };
        });

        // Build list of not-submitted students
        const submittedUserIds = new Set(asgnSubs.map((s) => String(s.student_id)));
        const isPastDue = asgn.due_date ? new Date(asgn.due_date).getTime() < Date.now() : false;

        const notSubmittedStudents = targetStudentList
          .filter((st) => !submittedUserIds.has(String(st.userId || st.id)))
          .map((st) => ({
            studentId: st.userId || st.id,
            studentName: st.name || st.email || 'Student',
            studentEmail: st.email || '',
            rollNumber: st.rollNumber || st.roll_number || null,
            phone: st.phone || null,
            school: st.school || null,
            groupName: groupMembersMap[String(st.userId || st.id)] || globalStudentGroupMap[String(st.userId || st.id)] || null,
            isOverdue: isPastDue
          }));

        const totalSubmitted = submittedStudents.length;
        const totalTargetGroups = targetGroups.length;
        const totalTargetStudents = targetStudentList.length;
        const totalNotSubmitted = Math.max(0, totalTargetStudents - totalSubmitted);

        const overallProjectRate = totalTargetStudents > 0
          ? Math.round((totalSubmitted / totalTargetStudents) * 100)
          : (totalSubmitted > 0 ? 100 : 0);

        return {
          id: asgn.id,
          title: asgn.title,
          description: asgn.description,
          courseName: asgn.course_name || 'General Coursework',
          assignedToType: asgn.assigned_to_type,
          dueDate: asgn.due_date,
          onedriveLink: asgn.onedrive_link,
          questionPaperUrl: asgn.question_paper_url,
          questionPaperName: asgn.question_paper_name,
          totalSubmitted,
          totalNotSubmitted,
          totalTargetGroups,
          totalTargetStudents,
          overallProjectRate: Math.min(overallProjectRate, 100),
          groupBreakdown,
          submittedStudents,
          notSubmittedStudents
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

    // Calculate Courses Taught breakdown for faculty dashboard
    const coursesMap = {};
    assignments.forEach((asgn) => {
      const cName = asgn.course_name || 'General Coursework';
      if (!coursesMap[cName]) {
        coursesMap[cName] = {
          courseName: cName,
          assignmentCount: 0,
          assignments: [],
          studentCount: students.length,
          submittedCount: 0,
          gradedCount: 0,
          pendingCount: 0
        };
      }
      coursesMap[cName].assignmentCount += 1;
      coursesMap[cName].assignments.push(asgn.id);
    });

    Object.values(coursesMap).forEach((course) => {
      const courseAsgnIds = new Set(course.assignments.map(id => String(id)));
      const courseSubs = submissions.filter(s => courseAsgnIds.has(String(s.assignment_id)));
      course.submittedCount = courseSubs.length;
      course.gradedCount = courseSubs.filter(s => Boolean(s.grade)).length;
      const expectedTotal = course.studentCount * course.assignmentCount;
      course.pendingCount = Math.max(0, expectedTotal - course.submittedCount);
      course.completionRate = expectedTotal > 0 ? Math.round((course.submittedCount / expectedTotal) * 100) : (course.submittedCount > 0 ? 100 : 0);
    });

    const coursesTaught = Object.values(coursesMap);

    res.json({
      summary: {
        totalStudents: students.length,
        totalGroups: groups.length,
        totalAssignments: assignments.length,
        totalSubmissions: submissions.length,
        overallCompletionRate
      },
      coursesTaught,
      assignmentPerformance,
      groupPerformance,
      recentSubmissions
    });
  } catch (error) {
    console.error('Fetch Analytics Error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// 24. Courses Collection API Endpoints
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const coursesRes = await db.query('SELECT * FROM courses ORDER BY created_at DESC');
    let courses = coursesRes.rows || [];

    // If courses table is empty, derive dynamic courses from active assignments
    if (courses.length === 0) {
      const asgnsRes = await db.query('SELECT DISTINCT course_name FROM assignments');
      courses = (asgnsRes.rows || []).map((row, idx) => ({
        id: idx + 1,
        course_code: `COURSE-${idx + 101}`,
        course_name: row.course_name || 'General Coursework',
        description: `Official curriculum for ${row.course_name || 'General Coursework'}`
      }));
    }

    res.json({ courses });
  } catch (error) {
    console.error('Fetch Courses Error:', error);
    res.status(500).json({ message: 'Failed to fetch courses collection' });
  }
});

app.post('/api/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { courseCode, courseName, description } = req.body || {};
    if (!courseName || !courseName.trim()) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    const code = courseCode && courseCode.trim() ? courseCode.trim().toUpperCase() : `CS-${Math.floor(100 + Math.random() * 900)}`;
    const professorId = req.user && req.user.id ? String(req.user.id) : null;

    let result;
    try {
      result = await db.query(
        'INSERT INTO courses (course_code, course_name, description, professor_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [code, courseName.trim(), description ? description.trim() : '', professorId]
      );
    } catch (insertErr) {
      console.warn('Course insert with professor_id note:', insertErr.message);
      result = await db.query(
        'INSERT INTO courses (course_code, course_name, description) VALUES ($1, $2, $3) RETURNING *',
        [code, courseName.trim(), description ? description.trim() : '']
      );
    }

    const createdCourse = (result.rows && result.rows[0]) || {
      id: `crs-${Date.now()}`,
      course_code: code,
      course_name: courseName.trim(),
      description: description ? description.trim() : '',
      professor_id: professorId,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Course created successfully!',
      course: createdCourse
    });
  } catch (error) {
    console.error('Create Course Error:', error);
    res.status(500).json({ message: error.message || 'Failed to create course' });
  }
});

app.put('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { courseCode, courseName, description } = req.body || {};

    if (!courseName || !courseName.trim()) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    const result = await db.query(
      'UPDATE courses SET course_code = $1, course_name = $2, description = $3 WHERE id = $4 RETURNING *',
      [courseCode ? courseCode.trim().toUpperCase() : 'CS-101', courseName.trim(), description ? description.trim() : '', courseId]
    );

    res.json({
      message: 'Course updated successfully!',
      course: (result.rows && result.rows[0]) || null
    });
  } catch (error) {
    console.error('Update Course Error:', error);
    res.status(500).json({ message: error.message || 'Failed to update course' });
  }
});

app.delete('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    await db.query('DELETE FROM courses WHERE id = $1', [courseId]);
    res.json({ message: 'Course deleted successfully!' });
  } catch (error) {
    console.error('Delete Course Error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete course' });
  }
});

// 25. Fallback 404 Route & Global JSON Error Handler
app.use('/api', (req, res, next) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Express Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'A server error occurred'
  });
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
