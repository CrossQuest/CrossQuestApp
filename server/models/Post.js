const knex = require("../db/knex");

class Post {
  constructor({ id, user_id, score, time, message }) {
    this.id = id;
    this.user_id = user_id;
    this.score = score;
    this.time = time;
    this.message = message;
  }

  // Create a new post
  static async create(userId, score) {
    const query = `
      INSERT INTO posts (user_id, score)
      VALUES (?, ?)
      RETURNING *
    `;
    const result = await knex.raw(query, [userId, score]);
    const rawPostData = result.rows[0];
    return new Post(rawPostData);
  }

    // Fetch all posts with user info sorted by score
  static async getAll() {
    const query = `
      SELECT posts.id, posts.score, users.username, posts.user_id
      FROM posts 
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.score DESC
      LIMIT 10
    `;
    const result = await knex.raw(query);
    return result.rows;
  }

  // Fetch all scores with user info, sorted high to low
  static async getScoresSorted() {
    const query = `
      SELECT posts.id, posts.score, users.username, posts.user_id
      FROM posts 
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.score DESC
    `;
    const result = await knex.raw(query);
    return result.rows;
  }

  // Fetch scores for a specific user
  static async getUserScores(userId) {
    const query = `
      SELECT posts.id, posts.score
      FROM posts 
      WHERE posts.user_id = ?
      ORDER BY posts.score DESC
    `;
    const result = await knex.raw(query, [userId]);
    return result.rows;
  }

  // (Optional) Add more static methods for fetching, updating, or deleting posts as needed
}

module.exports = Post;
