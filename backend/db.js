const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) {}
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch (e) {}
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') }); } catch (e) {}

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

let pool = null;
let useFallbackDb = false;

// Fallback in-memory/file storage if PostgreSQL connection is not provided or fails
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production');
const fallbackDataPath = isServerless
  ? path.join('/tmp', 'data_fallback.json')
  : path.join(__dirname, 'data_fallback.json');
let fallbackUsers = [];
let fallbackGroups = [];
let fallbackGroupMembers = [];
let fallbackNotifications = [];
let fallbackAssignments = [];
let fallbackSubmissions = [];

let nextUserId = 1;
let nextGroupId = 1;
let nextMemberId = 1;
let nextNotificationId = 1;
let nextAssignmentId = 1;
let nextSubmissionId = 1;

function loadFallbackData() {
  try {
    if (fs.existsSync(fallbackDataPath)) {
      const content = fs.readFileSync(fallbackDataPath, 'utf8');
      const parsed = JSON.parse(content);
      fallbackUsers = parsed.users || [];
      fallbackGroups = parsed.groups || [];
      fallbackGroupMembers = parsed.groupMembers || [];
      fallbackNotifications = parsed.notifications || [];
      fallbackAssignments = parsed.assignments || [];
      fallbackSubmissions = parsed.submissions || [];
      
      nextUserId = parsed.nextUserId || (fallbackUsers.length > 0 ? Math.max(...fallbackUsers.map(u => u.id)) + 1 : 1);
      nextGroupId = parsed.nextGroupId || (fallbackGroups.length > 0 ? Math.max(...fallbackGroups.map(g => g.id)) + 1 : 1);
      nextMemberId = parsed.nextMemberId || (fallbackGroupMembers.length > 0 ? Math.max(...fallbackGroupMembers.map(m => m.id)) + 1 : 1);
      nextNotificationId = parsed.nextNotificationId || (fallbackNotifications.length > 0 ? Math.max(...fallbackNotifications.map(n => n.id)) + 1 : 1);
      nextAssignmentId = parsed.nextAssignmentId || (fallbackAssignments.length > 0 ? Math.max(...fallbackAssignments.map(a => a.id)) + 1 : 1);
      nextSubmissionId = parsed.nextSubmissionId || (fallbackSubmissions.length > 0 ? Math.max(...fallbackSubmissions.map(s => s.id)) + 1 : 1);
    }
  } catch (err) {
    console.error('Error loading fallback data:', err.message);
  }
}

function saveFallbackData() {
  try {
    fs.writeFileSync(
      fallbackDataPath,
      JSON.stringify({
        users: fallbackUsers,
        groups: fallbackGroups,
        groupMembers: fallbackGroupMembers,
        notifications: fallbackNotifications,
        assignments: fallbackAssignments,
        submissions: fallbackSubmissions,
        nextUserId,
        nextGroupId,
        nextMemberId,
        nextNotificationId,
        nextAssignmentId,
        nextSubmissionId
      }, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('Error saving fallback data:', err.message);
  }
}

if (connectionString) {
  console.log('Connecting to PostgreSQL / Neon DB...');
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  });
  pool.on('error', (err) => {
    console.warn('PostgreSQL idle client error (reconnecting on next query):', err.message);
  });
} else {
  console.log('No DATABASE_URL set. Initializing file-backed local DB engine...');
  useFallbackDb = true;
  loadFallbackData();
}

async function initDb() {
  if (!useFallbackDb && pool) {
    try {
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL / Neon DB!');
      
      const safeMigrations = [
        `CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY DEFAULT ('usr-' || floor(extract(epoch from clock_timestamp()) * 1000)::text),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          role VARCHAR(50) DEFAULT 'student',
          name VARCHAR(255),
          school VARCHAR(255),
          class_name VARCHAR(100),
          roll_number VARCHAR(100),
          phone_number VARCHAR(50),
          google_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`,
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS school VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS class_name VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",

        "ALTER TABLE groups ADD COLUMN IF NOT EXISTS description TEXT",
        "ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",

        "ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member'",
        "ALTER TABLE group_members ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'accepted'",
        "ALTER TABLE group_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE group_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",

        `CREATE TABLE IF NOT EXISTS groups (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_by INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS group_members (
          id SERIAL PRIMARY KEY,
          group_id INTEGER,
          user_id INTEGER,
          role VARCHAR(50) DEFAULT 'member',
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(group_id, user_id)
        )`,

        `CREATE TABLE IF NOT EXISTS assignments (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          due_date TIMESTAMP WITH TIME ZONE,
          onedrive_link VARCHAR(500),
          assigned_to_type VARCHAR(50) DEFAULT 'all',
          assigned_group_ids TEXT,
          created_by INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS courses (
          id SERIAL PRIMARY KEY,
          course_code VARCHAR(50) NOT NULL,
          course_name VARCHAR(255) NOT NULL,
          description TEXT,
          professor_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS course_enrollments (
          id SERIAL PRIMARY KEY,
          course_id INTEGER,
          student_id INTEGER,
          enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`,

        "ALTER TABLE groups ADD COLUMN IF NOT EXISTS leader_id INTEGER",
        "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS course_id INTEGER",
        "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS onedrive_link VARCHAR(500)",
        "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_to_type VARCHAR(50) DEFAULT 'all'",
        "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_group_ids TEXT",
        "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS question_paper_url TEXT",
        "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS question_paper_name VARCHAR(255)",
        "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS course_name VARCHAR(255) DEFAULT 'General Coursework'",
        "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",

        `CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          sender_id VARCHAR(255),
          group_id VARCHAR(255),
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'unread',
          invitation_status VARCHAR(50) DEFAULT 'none',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS assignment_submissions (
          id SERIAL PRIMARY KEY,
          assignment_id INTEGER,
          student_id INTEGER,
          group_id INTEGER,
          status VARCHAR(50) DEFAULT 'submitted',
          submission_link VARCHAR(500),
          submission_notes TEXT,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`,

        "ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS grade VARCHAR(50)",
        "ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS feedback TEXT",
        "ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITH TIME ZONE",

        "CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_assignment_student ON assignment_submissions (assignment_id, student_id)"
      ];

      for (const stmt of safeMigrations) {
        try {
          await client.query(stmt);
        } catch (mErr) {
          console.warn('Migration step note:', mErr.message);
        }
      }

      client.release();
      console.log('PostgreSQL / Neon DB tables & schema verified successfully.');
    } catch (err) {
      console.warn('PostgreSQL connection failed:', err.message, '- Falling back to persistent local storage.');
      useFallbackDb = true;
      loadFallbackData();
    }
  }
}

// Emulate pg query interface for seamless integration
async function query(text, params = []) {
  if (!useFallbackDb && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('PostgreSQL query notice:', err.message);
      const isConnError =
        err.code === 'ECONNRESET' ||
        err.code === '57P01' ||
        err.code === 'ENOTFOUND' ||
        err.code === 'ETIMEDOUT' ||
        (err.message && (
          err.message.includes('terminated') ||
          err.message.includes('ENOTFOUND') ||
          err.message.includes('timeout')
        ));

      if (isConnError) {
        try {
          console.log('Retrying PostgreSQL query...');
          return await pool.query(text, params);
        } catch (retryErr) {
          console.warn('PostgreSQL retry failed. Switching seamlessly to local persistent storage:', retryErr.message);
          useFallbackDb = true;
          loadFallbackData();
        }
      } else {
        throw err;
      }
    }
  }

  function fallbackIdsMatch(a, b) {
    return String(a) === String(b);
  }

  // Basic SQL parser for fallback DB
  const sql = text.trim();
  const normalized = sql.replace(/\s+/g, ' ');

  // SELECT user by email
  if (normalized.match(/^SELECT \* FROM users WHERE email = \$1/i)) {
    const email = (params[0] || '').toLowerCase();
    const user = fallbackUsers.find(u => (u.email || '').toLowerCase() === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // SELECT user by Google ID
  if (normalized.match(/^SELECT \* FROM users WHERE google_id = \$1/i)) {
    const googleId = params[0];
    const user = fallbackUsers.find((u) => u.google_id && String(u.google_id) === String(googleId));
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // SELECT user by id
  if (normalized.match(/^SELECT \* FROM users WHERE id = \$1/i)) {
    const user = fallbackUsers.find(u => fallbackIdsMatch(u.id, params[0]));
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // SEARCH students by roll_number, name, email
  if (normalized.match(/ILIKE/i)) {
    const termParam = params.find(p => typeof p === 'string') || '';
    const term = termParam.replace(/%/g, '').toLowerCase();
    const matched = fallbackUsers.filter(u => {
      if (u.role !== 'student') return false;
      const rollMatch = u.roll_number && u.roll_number.toLowerCase().includes(term);
      const nameMatch = u.name && u.name.toLowerCase().includes(term);
      const emailMatch = u.email && u.email.toLowerCase().includes(term);
      return rollMatch || nameMatch || emailMatch;
    });
    return { rows: matched, rowCount: matched.length };
  }

  // SELECT all students (Admin)
  if (normalized.match(/^SELECT \* FROM users WHERE role = \$1/i)) {
    const role = params[0];
    const matched = fallbackUsers.filter(u => u.role === role);
    return { rows: matched, rowCount: matched.length };
  }

  // SELECT all users
  if (normalized.match(/^SELECT \* FROM users ORDER BY id/i)) {
    return { rows: [...fallbackUsers], rowCount: fallbackUsers.length };
  }

  // INSERT INTO users
  if (normalized.match(/^INSERT INTO users/i)) {
    const newUser = {
      id: nextUserId++,
      email: params[0] || null,
      password_hash: params[1] || '',
      role: params[2] || 'student',
      name: params[3] || null,
      school: params[4] || null,
      class_name: params[5] || null,
      roll_number: params[6] || null,
      phone_number: params[7] || null,
      google_id: params[8] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    fallbackUsers.push(newUser);
    saveFallbackData();
    return { rows: [newUser], rowCount: 1 };
  }

  // UPDATE users SET google_id
  if (normalized.match(/^UPDATE users SET google_id/i)) {
    const [googleId, id] = params;
    const user = fallbackUsers.find((u) => String(u.id) === String(id));
    if (user) {
      user.google_id = googleId;
      user.updated_at = new Date().toISOString();
      saveFallbackData();
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // UPDATE users SET ...
  // Student profile: name, roll_number, phone_number, id (4 params)
  // Teacher profile: name, roll_number, phone_number, school, id (5 params)
  // Legacy: name, school, class_name, roll_number, phone_number, id (6 params)
  if (normalized.match(/^UPDATE users SET/i)) {
    let name;
    let school;
    let class_name;
    let roll_number;
    let phone_number;
    let id;

    if (params.length === 4) {
      [name, roll_number, phone_number, id] = params;
    } else if (params.length === 5) {
      [name, roll_number, phone_number, school, id] = params;
    } else {
      [name, school, class_name, roll_number, phone_number, id] = params;
    }

    const user = fallbackUsers.find((u) => String(u.id) === String(id));
    if (user) {
      if (name !== undefined) user.name = name;
      if (school !== undefined) user.school = school;
      if (class_name !== undefined) user.class_name = class_name;
      if (roll_number !== undefined) user.roll_number = roll_number;
      if (phone_number !== undefined) user.phone_number = phone_number;
      user.updated_at = new Date().toISOString();
      saveFallbackData();
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // --- GROUPS FALLBACK QUERIES ---

  // INSERT INTO groups
  if (normalized.match(/^INSERT INTO groups/i)) {
    const name = params[0];
    const description = params[1] || '';
    const created_by = parseInt(params[2], 10);
    const newGroup = {
      id: nextGroupId++,
      name,
      description,
      created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    fallbackGroups.push(newGroup);
    saveFallbackData();
    return { rows: [newGroup], rowCount: 1 };
  }

  // SELECT group by ID
  if (normalized.match(/^SELECT \* FROM groups WHERE id = \$1/i)) {
    const group = fallbackGroups.find(g => String(g.id) === String(params[0]));
    return { rows: group ? [group] : [], rowCount: group ? 1 : 0 };
  }

  // SELECT all groups
  if (normalized.match(/^SELECT \* FROM groups\b/i)) {
    return { rows: [...fallbackGroups], rowCount: fallbackGroups.length };
  }

  // SELECT groups for user (via group_members)
  if (normalized.match(/FROM groups g JOIN group_members gm/i) || normalized.match(/FROM group_members WHERE user_id/i)) {
    const userId = parseInt(params[0], 10);
    const userMemberships = fallbackGroupMembers.filter(m => m.user_id === userId);
    const userGroupIds = userMemberships.map(m => m.group_id);

    const resultGroups = fallbackGroups
      .filter(g => userGroupIds.includes(g.id))
      .map(g => {
        const mem = userMemberships.find(m => m.group_id === g.id);
        const allMembersForGroup = fallbackGroupMembers.filter(m => m.group_id === g.id);
        return {
          ...g,
          user_role: mem ? mem.role : 'member',
          user_status: mem ? mem.status : 'pending',
          member_count: allMembersForGroup.filter(m => m.status === 'accepted').length
        };
      });

    return { rows: resultGroups, rowCount: resultGroups.length };
  }

  // --- GROUP MEMBERS FALLBACK QUERIES ---

  // INSERT INTO group_members
  if (normalized.match(/^INSERT INTO group_members/i)) {
    const group_id = parseInt(params[0], 10);
    const user_id = parseInt(params[1], 10);
    const role = params[2] || 'member';
    const status = params[3] || 'pending';

    // Check existing
    const existing = fallbackGroupMembers.find(m => m.group_id === group_id && m.user_id === user_id);
    if (existing) {
      existing.role = role;
      existing.status = status;
      existing.updated_at = new Date().toISOString();
      saveFallbackData();
      return { rows: [existing], rowCount: 1 };
    }

    const newMember = {
      id: nextMemberId++,
      group_id,
      user_id,
      role,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    fallbackGroupMembers.push(newMember);
    saveFallbackData();
    return { rows: [newMember], rowCount: 1 };
  }

  // SELECT group_members for group_id & user_id (2 params)
  if (normalized.match(/FROM group_members/i) && params.length === 2) {
    const groupId = params[0];
    const userId = params[1];
    const member = fallbackGroupMembers.find(m => fallbackIdsMatch(m.group_id, groupId) && fallbackIdsMatch(m.user_id, userId));
    return { rows: member ? [member] : [], rowCount: member ? 1 : 0 };
  }

  // SELECT group_members for a group (by group_id)
  if (normalized.match(/FROM group_members/i) && (normalized.match(/WHERE.*group_id/i) || normalized.match(/WHERE.*gm\.group_id/i) || normalized.match(/WHERE.*g\.id/i))) {
    const groupId = params[0];
    let memberRows = fallbackGroupMembers.filter(m => fallbackIdsMatch(m.group_id, groupId));
    if (/status\s*=\s*'accepted'/i.test(normalized) || /LOWER\(status\)\s*=\s*'accepted'/i.test(normalized)) {
      memberRows = memberRows.filter(m => m.status === 'accepted' || m.role === 'creator' || m.role === 'admin');
    }
    const members = memberRows
      .map(m => {
        const user = fallbackUsers.find(u => fallbackIdsMatch(u.id, m.user_id)) || {};
        return {
          ...m,
          user_name: user.name || user.email,
          user_email: user.email,
          roll_number: user.roll_number,
          school: user.school,
          class_name: user.class_name
        };
      });
    return { rows: members, rowCount: members.length };
  }

  // SELECT group_members for a user (by user_id)
  if (normalized.match(/FROM group_members/i) && (normalized.match(/WHERE.*user_id/i) || normalized.match(/WHERE.*gm\.user_id/i))) {
    const userId = params[0];
    const members = fallbackGroupMembers.filter(m => fallbackIdsMatch(m.user_id, userId));
    const filtered = /status.*accepted/i.test(normalized) || /LOWER\(status\)\s*=\s*'accepted'/i.test(normalized) || /creator/i.test(normalized)
      ? members.filter(m => m.status === 'accepted' || m.role === 'creator' || m.role === 'admin')
      : members;
    return { rows: filtered, rowCount: filtered.length };
  }

  // UPDATE group_members status
  if (normalized.match(/^UPDATE group_members SET status = \$1/i)) {
    const status = params[0];
    const groupId = parseInt(params[1], 10);
    const userId = parseInt(params[2], 10);

    const mem = fallbackGroupMembers.find(m => m.group_id === groupId && m.user_id === userId);
    if (mem) {
      mem.status = status;
      mem.updated_at = new Date().toISOString();
      saveFallbackData();
      return { rows: [mem], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // --- NOTIFICATIONS FALLBACK QUERIES ---

  // INSERT INTO notifications
  if (normalized.match(/^INSERT INTO notifications/i)) {
    const user_id = parseInt(params[0], 10);
    const sender_id = parseInt(params[1], 10);
    const group_id = params[2] ? parseInt(params[2], 10) : null;
    const type = params[3];
    const title = params[4];
    const message = params[5];
    const status = params[6] || 'unread';
    const invitation_status = params[7] || 'none';

    const newNotif = {
      id: nextNotificationId++,
      user_id,
      sender_id,
      group_id,
      type,
      title,
      message,
      status,
      invitation_status,
      created_at: new Date().toISOString()
    };
    fallbackNotifications.push(newNotif);
    saveFallbackData();
    return { rows: [newNotif], rowCount: 1 };
  }

  // SELECT notification by ID and user_id
  if (normalized.match(/FROM notifications.*WHERE id = \$1/i)) {
    const id = parseInt(params[0], 10);
    const notif = fallbackNotifications.find(n => n.id === id);
    return { rows: notif ? [notif] : [], rowCount: notif ? 1 : 0 };
  }

  // SELECT notifications for user
  if (normalized.match(/FROM notifications/i)) {
    const userId = parseInt(params[0], 10);
    const userNotifs = fallbackNotifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(n => {
        const sender = fallbackUsers.find(u => u.id === n.sender_id) || {};
        const group = fallbackGroups.find(g => g.id === n.group_id) || {};
        return {
          ...n,
          sender_name: sender.name || sender.email,
          sender_email: sender.email,
          group_name: group.name
        };
      });
    return { rows: userNotifs, rowCount: userNotifs.length };
  }

  // UPDATE notification (mark read or update invitation status)
  if (normalized.match(/^UPDATE notifications SET/i)) {
    // Check parameters
    if (normalized.match(/status = \$1.*WHERE id = \$2/i)) {
      const status = params[0];
      const id = parseInt(params[1], 10);
      const notif = fallbackNotifications.find(n => n.id === id);
      if (notif) {
        notif.status = status;
        saveFallbackData();
        return { rows: [notif], rowCount: 1 };
      }
    }

    if (normalized.match(/invitation_status = \$1/i)) {
      const invStatus = params[0];
      const readStatus = params[1] || 'read';
      const id = parseInt(params[2], 10);
      const notif = fallbackNotifications.find(n => n.id === id);
      if (notif) {
        notif.invitation_status = invStatus;
        notif.status = readStatus;
        saveFallbackData();
        return { rows: [notif], rowCount: 1 };
      }
    }

    if (normalized.match(/status = 'read' WHERE user_id = \$1/i)) {
      const userId = parseInt(params[0], 10);
      fallbackNotifications.forEach(n => {
        if (n.user_id === userId) n.status = 'read';
      });
      saveFallbackData();
      return { rows: [], rowCount: 1 };
    }
  }

  // --- ASSIGNMENTS FALLBACK QUERIES ---

  // INSERT INTO assignments
  if (normalized.match(/^INSERT INTO assignments/i)) {
    const title = params[0];
    const description = params[1] || '';
    const course_name = params[2] || 'General Coursework';
    const due_date = params[3] || null;
    const onedrive_link = params[4] || null;
    const assigned_to_type = params[5] || 'all';
    const assigned_group_ids = params[6] || '[]';
    const created_by = parseInt(params[7], 10);
    const question_paper_url = params[8] || null;
    const question_paper_name = params[9] || null;

    const newAssignment = {
      id: nextAssignmentId++,
      title,
      description,
      course_name,
      due_date,
      onedrive_link,
      assigned_to_type,
      assigned_group_ids,
      created_by,
      question_paper_url,
      question_paper_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    fallbackAssignments.push(newAssignment);
    saveFallbackData();
    return { rows: [newAssignment], rowCount: 1 };
  }

  // UPDATE assignments
  if (normalized.match(/^UPDATE assignments SET/i)) {
    const title = params[0];
    const description = params[1];
    const course_name = params[2];
    const due_date = params[3];
    const onedrive_link = params[4];
    const assigned_to_type = params[5];
    const assigned_group_ids = params[6];
    const question_paper_url = params[7];
    const question_paper_name = params[8];
    const id = parseInt(params[9], 10);

    const item = fallbackAssignments.find(a => a.id === id);
    if (item) {
      if (title !== undefined) item.title = title;
      if (description !== undefined) item.description = description;
      if (course_name !== undefined) item.course_name = course_name;
      if (due_date !== undefined) item.due_date = due_date;
      if (onedrive_link !== undefined) item.onedrive_link = onedrive_link;
      if (assigned_to_type !== undefined) item.assigned_to_type = assigned_to_type;
      if (assigned_group_ids !== undefined) item.assigned_group_ids = assigned_group_ids;
      if (question_paper_url !== undefined) item.question_paper_url = question_paper_url;
      if (question_paper_name !== undefined) item.question_paper_name = question_paper_name;
      item.updated_at = new Date().toISOString();
      saveFallbackData();
      return { rows: [item], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // DELETE FROM assignments
  if (normalized.match(/^DELETE FROM assignments WHERE id = \$1/i)) {
    const id = parseInt(params[0], 10);
    const index = fallbackAssignments.findIndex(a => a.id === id);
    if (index !== -1) {
      const removed = fallbackAssignments.splice(index, 1);
      fallbackSubmissions = fallbackSubmissions.filter(s => s.assignment_id !== id);
      saveFallbackData();
      return { rows: removed, rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // SELECT single assignment by ID (string ids like asg-... or integer ids)
  if (normalized.match(/^SELECT \* FROM assignments\b/i)) {
    if (normalized.match(/WHERE/i) && params[0] != null) {
      const item = fallbackAssignments.find(a => fallbackIdsMatch(a.id, params[0]));
      return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
    }
    const sorted = [...fallbackAssignments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: sorted, rowCount: sorted.length };
  }

  // --- SUBMISSIONS FALLBACK QUERIES ---

  // INSERT INTO assignment_submissions
  if (normalized.match(/^INSERT INTO assignment_submissions/i)) {
    const assignment_id = params[0];
    const student_id = params[1];
    const group_id = params[2] || null;
    const status = params[3] || 'submitted';
    const submission_link = params[4] || null;
    const submission_notes = params[5] || null;

    const existing = fallbackSubmissions.find(s => fallbackIdsMatch(s.assignment_id, assignment_id) && fallbackIdsMatch(s.student_id, student_id));
    if (existing) {
      existing.status = status;
      existing.submission_link = submission_link;
      existing.submission_notes = submission_notes;
      existing.group_id = group_id;
      existing.submitted_at = new Date().toISOString();
      saveFallbackData();
      return { rows: [existing], rowCount: 1 };
    }

    const newSub = {
      id: nextSubmissionId++,
      assignment_id,
      student_id,
      group_id,
      status,
      submission_link,
      submission_notes,
      submitted_at: new Date().toISOString()
    };
    fallbackSubmissions.push(newSub);
    saveFallbackData();
    return { rows: [newSub], rowCount: 1 };
  }

  // UPDATE assignment_submissions (resubmit / grade)
  if (normalized.match(/^UPDATE assignment_submissions SET/i)) {
    if (normalized.match(/grade\s*=/i)) {
      // Grade update query: SET grade = $1, feedback = $2, status = $3, graded_at = CURRENT_TIMESTAMP WHERE id = $4
      const [grade, feedback, status, id] = params;
      const existing = fallbackSubmissions.find(s => fallbackIdsMatch(s.id, id));
      if (existing) {
        existing.grade = grade;
        existing.feedback = feedback;
        existing.status = status || 'graded';
        existing.graded_at = new Date().toISOString();
        saveFallbackData();
        return { rows: [existing], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    const group_id = params[0] || null;
    const status = params[1] || 'submitted';
    const submission_link = params[2] || null;
    const submission_notes = params[3] || null;
    const assignmentId = params[4];
    const studentId = params[5];
    const existing = fallbackSubmissions.find(s => fallbackIdsMatch(s.assignment_id, assignmentId) && fallbackIdsMatch(s.student_id, studentId));
    if (existing) {
      existing.group_id = group_id;
      existing.status = status;
      existing.submission_link = submission_link;
      existing.submission_notes = submission_notes;
      existing.submitted_at = new Date().toISOString();
      saveFallbackData();
      return { rows: [existing], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // SELECT submissions for assignment (optionally scoped to one student)
  if (normalized.match(/FROM assignment_submissions/i) && normalized.match(/assignment_id/i)) {
    const assignmentId = params[0];
    let matched = fallbackSubmissions.filter(s => fallbackIdsMatch(s.assignment_id, assignmentId));
    if (normalized.match(/student_id/i) && params[1] != null) {
      const studentId = params[1];
      matched = matched.filter(s => fallbackIdsMatch(s.student_id, studentId));
    }
    const subs = matched
      .map(s => {
        const student = fallbackUsers.find(u => u.id === s.student_id) || {};
        const group = fallbackGroups.find(g => g.id === s.group_id) || {};
        return {
          ...s,
          student_name: student.name || student.email,
          student_email: student.email,
          roll_number: student.roll_number,
          school: student.school,
          class_name: student.class_name,
          group_name: group.name || null
        };
      });
    return { rows: subs, rowCount: subs.length };
  }

  // SELECT all submissions
  if (normalized.match(/FROM assignment_submissions/i)) {
    const subs = fallbackSubmissions.map(s => {
      const student = fallbackUsers.find(u => u.id === s.student_id) || {};
      const group = fallbackGroups.find(g => g.id === s.group_id) || {};
      const assignment = fallbackAssignments.find(a => a.id === s.assignment_id) || {};
      return {
        ...s,
        assignment_title: assignment.title,
        student_name: student.name || student.email,
        student_email: student.email,
        roll_number: student.roll_number,
        school: student.school,
        class_name: student.class_name,
        group_name: group.name || null
      };
    });
    return { rows: subs, rowCount: subs.length };
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  query,
  initDb,
  get pool() { return pool; }
};
