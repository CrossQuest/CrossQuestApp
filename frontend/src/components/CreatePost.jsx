import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFeedEntry, getUserScores } from '../adapters/score-adapters';
import UserContext from '../contexts/current-user-context';
import '../styles/create-post.css';

export default function CreatePost({ onPostCreated }) {
  const { currentUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [selectedScore, setSelectedScore] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userScores, setUserScores] = useState([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);

  // Load user's scores when component mounts
  useEffect(() => {
    if (currentUser) {
      loadUserScores();
    }
  }, [currentUser]);

  // Refresh scores when the component is focused (user returns from game)
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser) {
        // Add a small delay to ensure the score has been saved
        setTimeout(() => {
          loadUserScores();
        }, 500);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser]);

  const loadUserScores = async () => {
    setIsLoadingScores(true);
    try {
      console.log('Loading scores for user:', currentUser.id, 'currentUser:', currentUser);
      const [scores, err] = await getUserScores(currentUser.id);
      console.log('Scores response:', { scores, err });
      if (!err && scores) {
        setUserScores(scores);
        console.log('Set user scores:', scores);
      } else {
        console.log('Error loading scores:', err);
      }
    } catch (err) {
      console.error('Failed to load user scores:', err);
    } finally {
      setIsLoadingScores(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Please log in to create a post');
      return;
    }

    if (!selectedScore) {
      setError('Please select a score');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const messageToSend = message.trim() || null; // Send null if message is empty
      const [data, err] = await createFeedEntry({ score: parseInt(selectedScore), message: messageToSend });
      if (err) {
        setError('Failed to create post');
      } else {
        // Clear form
        setSelectedScore('');
        setMessage('');
        setError('');
        // Notify parent to refresh feed
        onPostCreated();
      }
    } catch (err) {
      setError('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="create-post-container">
        <div className="create-post-box">
          <h3>Create Post</h3>
          <p>Please log in to create a post</p>
        </div>
      </div>
    );
  }

  console.log('CreatePost render - userScores:', userScores.length, 'isLoading:', isLoadingScores);

  return (
    <div className="create-post-container">
      <div className="create-post-box">
        <h3>Create Post</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="score">Select Your Score:</label>
            {isLoadingScores ? (
              <div className="loading-scores">Loading your scores...</div>
            ) : userScores.length > 0 ? (
              <select
                id="score"
                value={selectedScore}
                onChange={(e) => setSelectedScore(e.target.value)}
                required
              >
                <option value="">Choose a score to post</option>
                {userScores
                  .map(scoreData => scoreData.score)
                  .filter((score, index, scores) => scores.indexOf(score) === index)
                  .sort((a, b) => b - a)
                  .map((score, index) => (
                    <option key={index} value={score}>
                      {score} points
                    </option>
                  ))}
              </select>
            ) : (
              <div className="no-scores">
                <p>No scores found. Play the game first to create posts!</p>
                <button 
                  type="button" 
                  className="play-game-btn"
                  onClick={() => navigate('/play')}
                >
                  Play Game
                </button>
                <button 
                  type="button" 
                  className="refresh-scores-btn"
                  onClick={loadUserScores}
                >
                  Refresh Scores
                </button>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Message (Optional):</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your achievement or message... (optional)"
              rows="4"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </form>
      </div>
    </div>
  );
} 