const knex = require("../db/knex");

class Competition {
  constructor({ id, creator_id, opponent_id, creator_score, opponent_score, status, created_at, start_time, end_time, winner, challenger_username, challenged_username, creator_attempts, opponent_attempts, max_attempts }) {
    this.id = id;
    this.challenger_id = creator_id; // Map to existing column
    this.challenged_id = opponent_id; // Map to existing column
    this.challenger_score = creator_score; // Map to existing column
    this.challenged_score = opponent_score; // Map to existing column
    this.status = status;
    this.created_at = created_at;
    this.start_time = start_time;
    this.end_time = end_time;
    this.winner = winner;
    this.challenger_username = challenger_username;
    this.challenged_username = challenged_username;
    this.creator_attempts = creator_attempts || 0;
    this.opponent_attempts = opponent_attempts || 0;
    this.max_attempts = max_attempts || 3;
  }

  // Create a new competition
  static async create(challengerId, challengedId) {
    const query = `
      INSERT INTO competitions (creator_id, opponent_id)
      VALUES (?, ?)
      RETURNING *
    `;
    const result = await knex.raw(query, [challengerId, challengedId]);
    const rawCompetitionData = result.rows[0];
    return new Competition(rawCompetitionData);
  }

  // Get all competitions for a user (as challenger or challenged)
  static async getUserCompetitions(userId) {
    const query = `
      SELECT c.*, 
             u1.username as challenger_username,
             u2.username as challenged_username
      FROM competitions c
      JOIN users u1 ON c.creator_id = u1.id
      JOIN users u2 ON c.opponent_id = u2.id
      WHERE c.creator_id = ? OR c.opponent_id = ?
      ORDER BY c.created_at DESC
    `;
    const result = await knex.raw(query, [userId, userId]);
    return result.rows.map((rawCompetitionData) => new Competition(rawCompetitionData));
  }

  // Get pending competitions for a user
  static async getPendingCompetitions(userId) {
    const query = `
      SELECT c.*, 
             u1.username as challenger_username,
             u2.username as challenged_username
      FROM competitions c
      JOIN users u1 ON c.creator_id = u1.id
      JOIN users u2 ON c.opponent_id = u2.id
      WHERE (c.creator_id = ? OR c.opponent_id = ?) AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `;
    const result = await knex.raw(query, [userId, userId]);
    return result.rows.map((rawCompetitionData) => new Competition(rawCompetitionData));
  }

  // Get active competitions for a user
  static async getActiveCompetitions(userId) {
    const query = `
      SELECT c.*, 
             u1.username as challenger_username,
             u2.username as challenged_username
      FROM competitions c
      JOIN users u1 ON c.creator_id = u1.id
      JOIN users u2 ON c.opponent_id = u2.id
      WHERE (c.creator_id = ? OR c.opponent_id = ?) AND c.status = 'active'
      ORDER BY c.created_at DESC
    `;
    const result = await knex.raw(query, [userId, userId]);
    return result.rows.map((rawCompetitionData) => new Competition(rawCompetitionData));
  }

  // Update competition status
  static async updateStatus(competitionId, status) {
    const query = `
      UPDATE competitions 
      SET status = ?
      WHERE id = ?
      RETURNING *
    `;
    const result = await knex.raw(query, [status, competitionId]);
    return result.rows[0] ? new Competition(result.rows[0]) : null;
  }

  // Update competition scores and attempts
  static async updateScoresAndAttempts(competitionId, challengerScore, challengedScore, isChallenger) {
    // First check if user has already reached max attempts
    const currentCompetition = await this.getById(competitionId);
    if (!currentCompetition) {
      throw new Error('Competition not found');
    }

    const currentAttempts = isChallenger ? currentCompetition.creator_attempts : currentCompetition.opponent_attempts;
    console.log('Current attempts before update:', { currentAttempts, maxAttempts: currentCompetition.max_attempts, isChallenger });
    console.log('User attempting to play - current attempts:', currentAttempts, 'max:', currentCompetition.max_attempts);
    if (currentAttempts >= currentCompetition.max_attempts) {
      console.log('User has already used all attempts - rejecting');
      throw new Error(`User has already used all ${currentCompetition.max_attempts} attempts`);
    }

    let query, params;
    
    if (isChallenger) {
      query = `
        UPDATE competitions 
        SET creator_score = ?, creator_attempts = creator_attempts + 1
        WHERE id = ? AND creator_attempts < max_attempts
        RETURNING *
      `;
      params = [challengerScore, competitionId];
    } else {
      query = `
        UPDATE competitions 
        SET opponent_score = ?, opponent_attempts = opponent_attempts + 1
        WHERE id = ? AND opponent_attempts < max_attempts
        RETURNING *
      `;
      params = [challengedScore, competitionId];
    }
    
    const result = await knex.raw(query, params);
    console.log('Update result:', result.rows[0]);
    if (!result.rows[0]) {
      throw new Error('Failed to update competition - max attempts reached');
    }
    
    const updatedCompetition = new Competition(result.rows[0]);
    console.log('Updated competition attempts:', { 
      creator: updatedCompetition.creator_attempts, 
      opponent: updatedCompetition.opponent_attempts,
      max: updatedCompetition.max_attempts 
    });
    return updatedCompetition;
  }

  // Check if competition should auto-complete
  static async shouldAutoComplete(competitionId) {
    const query = `
      SELECT creator_attempts, opponent_attempts, max_attempts
      FROM competitions
      WHERE id = ?
    `;
    const result = await knex.raw(query, [competitionId]);
    const competition = result.rows[0];
    
    console.log('Checking auto-complete for competition:', competitionId);
    console.log('Attempts data:', competition);
    
    if (!competition) {
      console.log('Competition not found');
      return false;
    }
    
    const shouldComplete = competition.creator_attempts >= competition.max_attempts && 
                          competition.opponent_attempts >= competition.max_attempts;
    
    console.log('Should auto-complete:', shouldComplete);
    console.log('Creator attempts:', competition.creator_attempts, '/', competition.max_attempts);
    console.log('Opponent attempts:', competition.opponent_attempts, '/', competition.max_attempts);
    console.log('Auto-complete condition check:', {
      creatorReached: competition.creator_attempts >= competition.max_attempts,
      opponentReached: competition.opponent_attempts >= competition.max_attempts,
      bothReached: shouldComplete
    });
    console.log('Attempts summary:', {
      creator: `${competition.creator_attempts}/${competition.max_attempts}`,
      opponent: `${competition.opponent_attempts}/${competition.max_attempts}`,
      shouldComplete: shouldComplete
    });
    
    return shouldComplete;
  }

  // Get user's attempt count in a competition
  static async getUserAttempts(competitionId, userId) {
    const query = `
      SELECT creator_attempts, opponent_attempts, max_attempts,
             creator_id, opponent_id
      FROM competitions
      WHERE id = ?
    `;
    const result = await knex.raw(query, [competitionId]);
    const competition = result.rows[0];
    
    if (!competition) return null;
    
    if (competition.creator_id === userId) {
      return {
        attempts: competition.creator_attempts,
        maxAttempts: competition.max_attempts,
        remaining: competition.max_attempts - competition.creator_attempts
      };
    } else if (competition.opponent_id === userId) {
      return {
        attempts: competition.opponent_attempts,
        maxAttempts: competition.max_attempts,
        remaining: competition.max_attempts - competition.opponent_attempts
      };
    }
    
    return null;
  }

  // Complete competition and set winner
  static async completeCompetition(competitionId, winner) {
    const query = `
      UPDATE competitions 
      SET status = 'completed', end_time = NOW()
      WHERE id = ?
      RETURNING *
    `;
    const result = await knex.raw(query, [competitionId]);
    return result.rows[0] ? new Competition(result.rows[0]) : null;
  }

  // Get competition by ID
  static async getById(competitionId) {
    const query = `
      SELECT c.*, 
             u1.username as challenger_username,
             u2.username as challenged_username
      FROM competitions c
      JOIN users u1 ON c.creator_id = u1.id
      JOIN users u2 ON c.opponent_id = u2.id
      WHERE c.id = ?
    `;
    const result = await knex.raw(query, [competitionId]);
    return result.rows[0] ? new Competition(result.rows[0]) : null;
  }
}

module.exports = Competition;

