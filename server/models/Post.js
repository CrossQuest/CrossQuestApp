const knex = require('../db/knex');

class Post {
  constructor({ id, user_id, score, time, message }) {
    this.id = id;
    this.user_id = user_id;
    this.score = score;
    this.time = time;
    this.message = message;
  }

  // Create a new post
  static async create(userId, score, time, message) {
    const query = `
      INSERT INTO posts (user_id, score, time, message)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `;
    const result = await knex.raw(query, [userId, score, time, message]);
    const rawPostData = result.rows[0];
    return new Post(rawPostData);
  }

  // Fetch all posts
  static async getAll() {
    const query = `SELECT * FROM posts`;
    const result = await knex.raw(query);
    return result.rows.map((rawPostData) => new Post(rawPostData));
  }

  // (Optional) Add more static methods for fetching, updating, or deleting posts as needed
}

module.exports = Post; 