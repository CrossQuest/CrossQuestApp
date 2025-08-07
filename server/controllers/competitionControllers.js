const Competition = require("../models/Competition");
const User = require("../models/User");

// Create a new competition (challenge someone)
exports.createCompetition = async (req, res) => {
  const { challengedId } = req.body;
  
  if (!challengedId) {
    return res.status(400).send({ message: "Challenged user ID is required" });
  }

  const challengerId = req.session.userId;
  if (!challengerId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  if (challengerId === challengedId) {
    return res.status(400).send({ message: "Cannot challenge yourself" });
  }

  try {
    const competition = await Competition.create(challengerId, challengedId);
    res.status(201).send(competition);
  } catch (err) {
    console.error('Error creating competition:', err);
    res.status(500).send({ message: "Failed to create competition." });
  }
};

// Get all competitions for the current user
exports.getUserCompetitions = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  try {
    const competitions = await Competition.getUserCompetitions(userId);
    res.status(200).send(competitions);
  } catch (err) {
    console.error('Error fetching competitions:', err);
    res.status(500).send({ message: "Failed to fetch competitions." });
  }
};

// Get pending competitions for the current user
exports.getPendingCompetitions = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  try {
    const competitions = await Competition.getPendingCompetitions(userId);
    res.status(200).send(competitions);
  } catch (err) {
    console.error('Error fetching pending competitions:', err);
    res.status(500).send({ message: "Failed to fetch pending competitions." });
  }
};

// Get active competitions for the current user
exports.getActiveCompetitions = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  try {
    const competitions = await Competition.getActiveCompetitions(userId);
    res.status(200).send(competitions);
  } catch (err) {
    console.error('Error fetching active competitions:', err);
    res.status(500).send({ message: "Failed to fetch active competitions." });
  }
};

// Accept a competition
exports.acceptCompetition = async (req, res) => {
  const { competitionId } = req.params;
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  try {
    const competition = await Competition.getById(competitionId);
    
    if (!competition) {
      return res.status(404).send({ message: "Competition not found" });
    }

    if (competition.challenged_id !== userId) {
      return res.status(403).send({ message: "Only the challenged user can accept" });
    }

    if (competition.status !== 'pending') {
      return res.status(400).send({ message: "Competition is not pending" });
    }

    const updatedCompetition = await Competition.updateStatus(competitionId, 'active');
    res.status(200).send(updatedCompetition);
  } catch (err) {
    console.error('Error accepting competition:', err);
    res.status(500).send({ message: "Failed to accept competition." });
  }
};

// Decline a competition
exports.declineCompetition = async (req, res) => {
  const { competitionId } = req.params;
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  try {
    const competition = await Competition.getById(competitionId);
    
    if (!competition) {
      return res.status(404).send({ message: "Competition not found" });
    }

    if (competition.challenged_id !== userId) {
      return res.status(403).send({ message: "Only the challenged user can decline" });
    }

    if (competition.status !== 'pending') {
      return res.status(400).send({ message: "Competition is not pending" });
    }

    const updatedCompetition = await Competition.updateStatus(competitionId, 'declined');
    res.status(200).send(updatedCompetition);
  } catch (err) {
    console.error('Error declining competition:', err);
    res.status(500).send({ message: "Failed to decline competition." });
  }
};

// Check user's remaining attempts in a competition
exports.getUserAttempts = async (req, res) => {
  const { competitionId } = req.params;
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  try {
    const attempts = await Competition.getUserAttempts(competitionId, userId);
    if (!attempts) {
      return res.status(404).send({ message: "Competition not found or user not a participant" });
    }
    res.status(200).send(attempts);
  } catch (err) {
    console.error('Error getting user attempts:', err);
    res.status(500).send({ message: "Failed to get user attempts." });
  }
};

// Submit score for a competition
exports.submitScore = async (req, res) => {
  const { competitionId } = req.params;
  const { score } = req.body;
  const userId = req.session.userId;
  
  console.log('Submit score request:', { competitionId, score, userId });
  
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  if (score === undefined || score === null) {
    console.log('Score validation failed - score is:', score);
    return res.status(400).send({ message: "Score is required" });
  }

  try {
    const competition = await Competition.getById(competitionId);
    console.log('Found competition:', competition);
    
    if (!competition) {
      return res.status(404).send({ message: "Competition not found" });
    }

    console.log('Competition status:', competition.status);
    if (competition.status !== 'active') {
      console.log('Competition status check failed - status is:', competition.status);
      return res.status(400).send({ message: "Competition is not active" });
    }

    if (competition.challenger_id !== userId && competition.challenged_id !== userId) {
      return res.status(403).send({ message: "Not a participant in this competition" });
    }

    console.log('Current scores:', { challenger: competition.challenger_score, challenged: competition.challenged_score });
    console.log('Current attempts:', { challenger: competition.creator_attempts, challenged: competition.opponent_attempts });
    console.log('User is challenger:', competition.challenger_id === userId);

    let updatedCompetition;
    const isChallenger = competition.challenger_id === userId;
    
    try {
      if (isChallenger) {
        // Only update if the new score is higher
        const newScore = Math.max(score, competition.challenger_score);
        console.log('Updating challenger score from', competition.challenger_score, 'to', newScore);
        updatedCompetition = await Competition.updateScoresAndAttempts(competitionId, newScore, competition.challenged_score, true);
      } else {
        // Only update if the new score is higher
        const newScore = Math.max(score, competition.challenged_score);
        console.log('Updating challenged score from', competition.challenged_score, 'to', newScore);
        updatedCompetition = await Competition.updateScoresAndAttempts(competitionId, competition.challenger_score, newScore, false);
      }
    } catch (err) {
      console.error('Error updating competition scores and attempts:', err);
      console.error('Error details:', err.message, err.stack);
      if (err.message.includes('max attempts reached')) {
        res.status(400).send({ message: "You have already used all 3 attempts in this competition." });
      } else {
        res.status(500).send({ message: "Failed to update competition." });
      }
      return;
    }

    // Check if competition should auto-complete
    const shouldComplete = await Competition.shouldAutoComplete(competitionId);
    console.log('Should complete competition:', shouldComplete);
    if (shouldComplete) {
      console.log('Auto-completing competition after 3 attempts each');
      console.log('Updated competition scores:', { challenger: updatedCompetition.challenger_score, challenged: updatedCompetition.challenged_score });
      
      // Get the full competition data with usernames for win tracking
      const fullCompetition = await Competition.getById(competitionId);
      console.log('Full competition data for winner determination:', fullCompetition);
      
      let winner = null;
      if (updatedCompetition.challenger_score > updatedCompetition.challenged_score) {
        winner = fullCompetition.challenger_username;
      } else if (updatedCompetition.challenged_score > updatedCompetition.challenger_score) {
        winner = fullCompetition.challenged_username;
      } else if (updatedCompetition.challenger_score === updatedCompetition.challenged_score && updatedCompetition.challenger_score > 0) {
        winner = "Tie";
      } else {
        winner = "No winner";
      }
      console.log('Winner determined:', winner);
      
      const completedCompetition = await Competition.completeCompetition(competitionId, winner);
      completedCompetition.winner = winner;

      // Track wins if there's a clear winner
      console.log('Winner determination:', { winner, challenger: fullCompetition.challenger_username, challenged: fullCompetition.challenged_username });
      console.log('Full competition data:', fullCompetition);
      if (winner && winner !== "Tie" && winner !== "No winner") {
        try {
          if (winner === fullCompetition.challenger_username) {
            console.log('Incrementing wins for challenger:', fullCompetition.challenger_id);
            const updatedUser = await User.incrementWins(fullCompetition.challenger_id);
            console.log('User wins updated:', updatedUser);
          } else if (winner === fullCompetition.challenged_username) {
            console.log('Incrementing wins for challenged:', fullCompetition.challenged_id);
            const updatedUser = await User.incrementWins(fullCompetition.challenged_id);
            console.log('User wins updated:', updatedUser);
          }
        } catch (err) {
          console.error('Error incrementing wins:', err);
          console.error('Error details:', err.message, err.stack);
        }
      } else {
        console.log('No win to track - winner is:', winner);
      }

      // Return the completed competition
      res.status(200).send(completedCompetition);
      return;
    }

    console.log('Updated competition:', updatedCompetition);
    res.status(200).send(updatedCompetition);
  } catch (err) {
    console.error('Error submitting score:', err);
    console.error('Error details:', err.message, err.stack);
    res.status(500).send({ message: "Failed to submit score." });
  }
};

// Complete a competition (determine winner)
exports.completeCompetition = async (req, res) => {
  const { competitionId } = req.params;
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).send({ message: "User must be authenticated" });
  }

  try {
    const competition = await Competition.getById(competitionId);
    
    if (!competition) {
      return res.status(404).send({ message: "Competition not found" });
    }

    if (competition.status !== 'active') {
      return res.status(400).send({ message: "Competition is not active" });
    }

    if (competition.challenger_id !== userId && competition.challenged_id !== userId) {
      return res.status(403).send({ message: "Not a participant in this competition" });
    }

    let winner = null;
    if (competition.challenger_score > competition.challenged_score) {
      winner = competition.challenger_username;
    } else if (competition.challenged_score > competition.challenger_score) {
      winner = competition.challenged_username;
    } else if (competition.challenger_score === competition.challenged_score && competition.challenger_score > 0) {
      winner = "Tie";
    } else {
      winner = "No winner";
    }

    const completedCompetition = await Competition.completeCompetition(competitionId, winner);
    // Add winner to the response since it's not stored in DB
    completedCompetition.winner = winner;

    // Track wins if there's a clear winner
    console.log('Competition completed. Winner:', winner);
    console.log('Challenger:', competition.challenger_username, 'ID:', competition.challenger_id);
    console.log('Challenged:', competition.challenged_username, 'ID:', competition.challenged_id);
    
    if (winner && winner !== "Tie" && winner !== "No winner") {
      try {
        // Find the winning user and increment their wins
        if (winner === competition.challenger_username) {
          console.log('Incrementing wins for challenger:', competition.challenger_id);
          await User.incrementWins(competition.challenger_id);
        } else if (winner === competition.challenged_username) {
          console.log('Incrementing wins for challenged:', competition.challenged_id);
          await User.incrementWins(competition.challenged_id);
        }
      } catch (err) {
        console.error('Error incrementing wins:', err);
        // Don't fail the request if win tracking fails
      }
    } else {
      console.log('No win to track - winner is:', winner);
    }

    res.status(200).send(completedCompetition);
  } catch (err) {
    console.error('Error completing competition:', err);
    res.status(500).send({ message: "Failed to complete competition." });
  }
}; 