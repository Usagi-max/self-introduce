const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      profile_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      contact_email TEXT,
      contact_name TEXT,
      contact_profile_data TEXT,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, contact_name)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT,
      event_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Helper functions
const dbHelper = {
  async register(email, password, name) {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
          `INSERT INTO users (email, password, name, profile_data) VALUES (?, ?, ?, ?)`,
          [email, hashedPassword, name, '{}'],
          function (err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, email, name });
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  },

  async login(email, password) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        
        const match = await bcrypt.compare(password, row.password);
        if (match) {
          resolve({ id: row.id, email: row.email, name: row.name, profile_data: JSON.parse(row.profile_data || '{}') });
        } else {
          resolve(null);
        }
      });
    });
  },

  async updateProfile(userId, profileData) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET profile_data = ? WHERE id = ?`,
        [JSON.stringify(profileData), userId],
        function (err) {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
  },

  async addContact(userId, contactName, contactProfileData, contactEmail = null) {
    return new Promise((resolve, reject) => {
      // Upsert contact based on user_id and contact_name
      db.run(
        `INSERT INTO contacts (user_id, contact_email, contact_name, contact_profile_data) 
         VALUES (?, ?, ?, ?) 
         ON CONFLICT(user_id, contact_name) DO UPDATE SET 
         contact_profile_data = excluded.contact_profile_data,
         played_at = CURRENT_TIMESTAMP`,
        [userId, contactEmail, contactName, JSON.stringify(contactProfileData)],
        function (err) {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
  },

  async getContacts(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM contacts WHERE user_id = ? ORDER BY played_at DESC`,
        [userId],
        (err, rows) => {
          if (err) return reject(err);
          const contacts = rows.map(r => ({
            id: r.id,
            name: r.contact_name,
            email: r.contact_email,
            profile_data: JSON.parse(r.contact_profile_data || '{}'),
            played_at: r.played_at
          }));
          resolve(contacts);
        }
      );
    });
  },

  async trackEvent(eventType, eventData = {}) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO analytics (event_type, event_data) VALUES (?, ?)`,
        [eventType, JSON.stringify(eventData)],
        function (err) {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
  }
};

module.exports = dbHelper;
