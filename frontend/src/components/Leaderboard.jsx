import { useState, useEffect } from 'react';
import { getAllScores } from '../adapters/score-adapters';
import '../styles/leaderboard.css';

export default function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const [data, err] = await getAllScores();
        if (err) {
          setError('Failed to load scores');
        } else {
          setScores(data);
        }
      } catch (err) {
        setError('Failed to load scores');
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  if (loading) {
    return <div className="leaderboard-loading">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="leaderboard-error">Error: {error}</div>;
  }

  return (
    <div className="leaderboard-container">
      <h2>🏆 Global Leaderboard</h2>
      <div className="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr key={score.id} className={index < 3 ? `rank-${index + 1}` : ''}>
                <td className="rank">#{index + 1}</td>
                <td className="username">{score.username}</td>
                <td className="score">{score.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 