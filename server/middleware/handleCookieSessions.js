const cookieSession = require('cookie-session');
const handleCookieSessions = cookieSession({
  name: 'session', // this creates a req.session property holding the cookie
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development', // this secret is used to hash the cookie
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  httpOnly: true,
  secure: false, // set to true in production with HTTPS
});

module.exports = handleCookieSessions;