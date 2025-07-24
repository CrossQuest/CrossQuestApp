const knex = require("../db/knex");

class Competition {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.player2Id = data.player_2_id;
    this.scorePlayer1 = data.score_player_1;
    this.scorePlayer2 = data.score_player_2;
    this.winner = data.winner;
  }

  // Create a new competition
  static async create(userId, player2Id, scorePlayer1, scorePlayer2, winner) {
    const query = `
      INSERT INTO competition (user_id, player_2_id, score_player_1, score_player_2, winner)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `;
    const result = await knex.raw(query, [userId, player2Id, scorePlayer1, scorePlayer2, winner]);
    const rawCompetitionData = result.rows[0];
    return new Competition(rawCompetitionData);
  }

  // (Optional) Add more static methods for fetching, updating, or deleting competitions as needed
}

module.exports = Competition;

