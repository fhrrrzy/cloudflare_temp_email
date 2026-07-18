const AUTH_KEY = 'temp_mail_auth';
const USER_KEY = 'temp_mail_user';

export const authService = {
  login(username, password) {
    // Hardcoded credentials for frontend-only protection
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(USER_KEY, JSON.stringify({ username: 'admin', role: 'Administrator' }));
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'true';
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  }
};
