import { useState, useEffect } from 'react';
import { getUserScores, getAllScores } from '../adapters/score-adapters';
import '../styles/user-scores.css';

export default function UserScores({ userId, username, wins = 0 }) {
  const [scores, setScores] = useState([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user scores
        const [userData, userErr] = await getUserScores(userId);
        if (userErr) {
          setError('Failed to load scores');
          return;
        }
        setScores(userData);

        // Fetch global leaderboard
        const [leaderboardData, leaderboardErr] = await getAllScores();
        if (!leaderboardErr) {
          setGlobalLeaderboard(leaderboardData);
        }
      } catch (err) {
        setError('Failed to load scores');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return <div className="user-scores-loading">Loading scores...</div>;
  }

  if (error) {
    return <div className="user-scores-error">Error: {error}</div>;
  }

  // Get top 10 scores (they should already be sorted by score DESC from backend)
  const topScores = scores.slice(0, 10);
  
  const highestScore = topScores.length > 0 ? Math.max(...topScores.map(s => s.score)) : 0;
  const top10Average = topScores.length > 0 
    ? Math.round(topScores.reduce((sum, s) => sum + s.score, 0) / topScores.length) 
    : 0;
  const overallAverage = scores.length > 0 
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) 
    : 0;

  // Calculate user's highest rank in global leaderboard
  const calculateHighestRank = () => {
    if (!globalLeaderboard.length || !scores.length) return null;
    
    // Find the user's highest score
    const userHighestScore = Math.max(...scores.map(s => s.score));
    
    // Find the rank of this score in the global leaderboard
    const rank = globalLeaderboard.findIndex(entry => 
      entry.user_id === userId && entry.score === userHighestScore
    );
    
    return rank !== -1 ? rank + 1 : null;
  };

  const highestRank = calculateHighestRank();

  return (
    <div className="user-scores-container">
      <h3>📊 {username}'s Scores</h3>
      
      <div className="user-scores-layout">
        {/* Left Column - Stats */}
        <div className="user-stats-section">
          <h4>📈 Statistics</h4>
          <div className="user-stats">
            <div className="stat-card">
              <span className="stat-label">Games Played</span>
              <span className="stat-value">{scores.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Top 10 Average</span>
              <span className="stat-value">{top10Average}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Overall Average</span>
              <span className="stat-value">{overallAverage}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Highest Score</span>
              <span className="stat-value">{highestScore}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Competition Wins</span>
              <span className="stat-value">🏆 {wins}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Highest Global Rank</span>
              <span className="stat-value">
                {highestRank ? `#${highestRank}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Top 10 Scores */}
        <div className="user-scores-section">
          {topScores.length > 0 ? (
            <div className="user-scores-table">
              <h4>🏆 Top 10 Scores</h4>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {topScores.map((score, index) => (
                    <tr key={score.id}>
                      <td className="game-number">#{index + 1}</td>
                      <td className="score">{score.score}</td>
                      <td className="date">
                        N/A
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-scores">
              <p>No scores yet. Play a game to see your scores here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 