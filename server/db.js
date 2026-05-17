// In-memory mock to avoid SQLite glibc compatibility issues on Render
const dbHelper = {
  async register(email, password, name) {
    return { id: 1, email, name };
  },

  async login(email, password) {
    return { id: 1, email, name: 'Demo User', profile_data: {} };
  },

  async updateProfile(userId, profileData) {
    return true;
  },

  async addContact(userId, contactName, contactProfileData, contactEmail = null) {
    return true;
  },

  async getContacts(userId) {
    return [];
  },

  async trackEvent(eventType, eventData = {}) {
    console.log(`[Analytics] ${eventType}:`, eventData);
    return true;
  }
};

module.exports = dbHelper;
