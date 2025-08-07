const knex = require('../db/knex');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

class User {
  #passwordHash = null; // a private property

  // Create a User instance with the password hidden
  // Instances of User can be sent to clients without exposing the password
  constructor({ id, username, password_hash, wins, name, email }) {
    this.id = id;
    this.username = username;
    this.#passwordHash = password_hash;
    this.wins = wins || 0;
    this.name = name || '';
    this.email = email || '';
  }

  // Controllers can use this instance method to validate passwords prior to sending responses
  isValidPassword = async (password) => {
    return await bcrypt.compare(password, this.#passwordHash);
  }

  // Hashes the given password and then creates a new user
  // in the users table. Returns the newly created user, using
  // the constructor to hide the passwordHash. 
  static async create(username, password, name, email) {
    // hash the plain-text password using bcrypt before storing it in the database
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      // Try to insert with name and email columns
      const query = `INSERT INTO users (username, password_hash, name, email)
        VALUES (?, ?, ?, ?) RETURNING *`;
      const result = await knex.raw(query, [username, passwordHash, name, email]);
      const rawUserData = result.rows[0];
      return new User(rawUserData);
    } catch (err) {
      // If name/email columns don't exist, fall back to original query
      console.log('Name/email columns not found, using fallback query');
      const query = `INSERT INTO users (username, password_hash)
        VALUES (?, ?) RETURNING *`;
      const result = await knex.raw(query, [username, passwordHash]);
      const rawUserData = result.rows[0];
      return new User(rawUserData);
    }
  }

  // Fetches ALL users from the users table, uses the constructor
  // to format each user (and hide their password hash), and returns.
  static async list() {
    const query = `SELECT * FROM users`;
    const result = await knex.raw(query);
    return result.rows.map((rawUserData) => new User(rawUserData));
  }

  // Fetches A single user from the users table that matches
  // the given user id. If it finds a user, uses the constructor
  // to format the user and returns or returns null if not.
  static async find(id) {
    const query = `SELECT * FROM users WHERE id = ?`;
    const result = await knex.raw(query, [id]);
    const rawUserData = result.rows[0];
    return rawUserData ? new User(rawUserData) : null;
  }


  // Same as above but uses the username to find the user
  static async findByUsername(username) {
    const query = `SELECT * FROM users WHERE username = ?`;
    const result = await knex.raw(query, [username]);
    const rawUserData = result.rows[0];
    return rawUserData ? new User(rawUserData) : null;
  }

  // Updates the user that matches the given id with a new username.
  // Returns the modified user, using the constructor to hide the passwordHash. 
  static async update(id, username) {
    const query = `
      UPDATE users
      SET username=?
      WHERE id=?
      RETURNING *
    `
    const result = await knex.raw(query, [username, id])
    const rawUpdatedUser = result.rows[0];
    return rawUpdatedUser ? new User(rawUpdatedUser) : null;
  };

  static async deleteAll() {
    return knex('users').del()
  }

  // Increment wins for a user
  static async incrementWins(userId) {
    console.log('Incrementing wins for user ID:', userId);
    try {
      const query = `
        UPDATE users
        SET wins = wins + 1
        WHERE id = ?
        RETURNING *
      `;
      const result = await knex.raw(query, [userId]);
      const rawUserData = result.rows[0];
      console.log('Win increment result:', rawUserData);
      return rawUserData ? new User(rawUserData) : null;
    } catch (err) {
      console.log('Error incrementing wins:', err);
      return null;
    }
  }

  // Get user with wins count
  static async findWithWins(id) {
    try {
      const query = `SELECT id, username, wins FROM users WHERE id = ?`;
      const result = await knex.raw(query, [id]);
      const rawUserData = result.rows[0];
      return rawUserData ? new User(rawUserData) : null;
    } catch (err) {
      // If wins column doesn't exist, fall back to regular find
      console.log('Wins column not found, falling back to regular user find');
      return await User.find(id);
    }
  }
}

module.exports = User;
