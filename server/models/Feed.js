const knex = require("../db/knex");

class Feed {
  constructor({ id, user_id, score, message, created_at, username }) {
    this.id = id;
    this.user_id = user_id;
    this.score = score;
    this.message = message || null; // Handle null messages
    this.created_at = created_at;
    this.username = username;
  }

  // Create a new feed entry
  static async create(userId, score, message) {
    console.log('Feed.create called with:', { userId, score, message });
    const query = `
      INSERT INTO feed (user_id, score, message)
      VALUES (?, ?, ?)
      RETURNING *
    `;
    const result = await knex.raw(query, [userId, score, message || null]);
    console.log('Database result:', result.rows[0]);
    const rawFeedData = result.rows[0];
    return new Feed(rawFeedData);
  }

  // Fetch all feed entries with user info, sorted by newest first
  static async getAll() {
    const query = `
      SELECT f.id, f.user_id, f.score, f.message, f.created_at, u.username
      FROM feed f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `;
    const result = await knex.raw(query);
    console.log('Feed.getAll raw results:', result.rows);
    return result.rows.map((rawFeedData) => new Feed(rawFeedData));
  }

  // Fetch feed entries for a specific user
  static async getUserFeed(userId) {
    const query = `
      SELECT f.id, f.user_id, f.score, f.created_at, u.username
      FROM feed f
      JOIN users u ON f.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;
    const result = await knex.raw(query, [userId]);
    return result.rows.map((rawFeedData) => new Feed(rawFeedData));
  }
}

module.exports = Feed; 