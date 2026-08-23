const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
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
function formatUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role || 'student',
    name: user.name || null,
    school: user.school || null,
    class: user.class_name || user.class || null,
    rollNumber: user.roll_number || user.rollNumber || null,
    phone: user.phone_number || user.phone || null,
    isProfileComplete: Boolean(user.school && user.class_name && user.roll_number && user.name && user.phone_number),
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
    const { name, school, class: className, rollNumber, phone } = req.body;

    if (!name || !school || !className || !rollNumber || !phone) {
      return res.status(400).json({
        message: 'All fields are required: Name, School, Class, Roll Number, and Phone Number'
      });
    }

    // Phone validation (basic digit check)
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 7) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }

    const updateResult = await db.query(
      'UPDATE users SET name = $1, school = $2, class_name = $3, roll_number = $4, phone_number = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name.trim(), school.trim(), className.trim(), rollNumber.trim(), cleanPhone, req.user.id]
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

// 8. Admin: Get All Students Endpoint
app.get('/api/admin/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE role = 'student' ORDER BY id DESC");
    const students = result.rows.map(formatUserResponse);
    res.json({ students, total: students.length });
  } catch (error) {
    console.error('Admin Fetch Error:', error);
    res.status(500).json({ message: 'Failed to fetch student directory' });
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
