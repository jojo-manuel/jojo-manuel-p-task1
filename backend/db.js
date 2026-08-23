const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

let pool = null;
let useFallbackDb = false;

// Fallback in-memory/file storage if PostgreSQL connection is not provided or fails
const fallbackDataPath = path.join(__dirname, 'data_fallback.json');
let fallbackUsers = [];
let nextId = 1;

function loadFallbackData() {
  try {
    if (fs.existsSync(fallbackDataPath)) {
      const content = fs.readFileSync(fallbackDataPath, 'utf8');
      const parsed = JSON.parse(content);
      fallbackUsers = parsed.users || [];
      nextId = parsed.nextId || (fallbackUsers.length > 0 ? Math.max(...fallbackUsers.map(u => u.id)) + 1 : 1);
    }
  } catch (err) {
    console.error('Error loading fallback data:', err.message);
  }
}

function saveFallbackData() {
  try {
    fs.writeFileSync(fallbackDataPath, JSON.stringify({ users: fallbackUsers, nextId }, null, 2), 'utf8');
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
      : { rejectUnauthorized: false }
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
      
      // Auto setup schema
      const schemaSql = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'student',
          name VARCHAR(255),
          school VARCHAR(255),
          class_name VARCHAR(100),
          roll_number VARCHAR(100),
          phone_number VARCHAR(50),
          google_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      `;
      await client.query(schemaSql);
      client.release();
      console.log('Database tables verified/created successfully.');
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
    return pool.query(text, params);
  }

  // Basic SQL parser for fallback DB
  const sql = text.trim();
  const normalized = sql.replace(/\s+/g, ' ');

  // SELECT user by email
  if (normalized.match(/^SELECT \* FROM users WHERE email = \$1/i)) {
    const email = params[0];
    const user = fallbackUsers.find(u => u.email === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // SELECT user by id
  if (normalized.match(/^SELECT \* FROM users WHERE id = \$1/i)) {
    const id = parseInt(params[0], 10);
    const user = fallbackUsers.find(u => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
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
    // Columns vary: email, password_hash, role, name, school, class_name, roll_number, phone_number, google_id
    const newUser = {
      id: nextId++,
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

  // UPDATE student details
  if (normalized.match(/^UPDATE users SET/i)) {
    // UPDATE users SET name = $1, school = $2, class_name = $3, roll_number = $4, phone_number = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *
    const name = params[0];
    const school = params[1];
    const class_name = params[2];
    const roll_number = params[3];
    const phone_number = params[4];
    const id = parseInt(params[5], 10);

    const user = fallbackUsers.find(u => u.id === id);
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

  return { rows: [], rowCount: 0 };
}

module.exports = {
  query,
  initDb,
  get pool() { return pool; }
};
