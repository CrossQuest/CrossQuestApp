import { useState, useEffect, useContext } from 'react';
import { getAllFeed, createCompetition } from '../adapters/score-adapters';
import UserContext from '../contexts/current-user-context';
import NotificationPopup from './NotificationPopup';
import '../styles/feed.css';

export default function Feed() {
  const { currentUser } = useContext(UserContext);
  const [feedEntries, setFeedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challenging, setChallenging] = useState({});
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const [data, err] = await getAllFeed();
        if (err) {
          console.error('Feed fetch error:', err);
          setError('Failed to load feed');
        } else {
          console.log('Feed data received:', data);
          console.log('Feed data type:', typeof data);
          console.log('Feed data length:', data ? data.length : 'no data');
          setFeedEntries(data || []);
        }
      } catch (err) {
        setError('Failed to load feed');
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleChallenge = async (userId, username) => {
    if (!currentUser) return;
    
    if (currentUser.id === userId) {
      setNotification({ message: "You cannot challenge yourself!", type: 'warning', isVisible: true });
      return;
    }

    setChallenging(prev => ({ ...prev, [userId]: true }));
    
    try {
      const [data, err] = await createCompetition({ challengedId: userId });
      if (err) {
        setNotification({ message: 'Failed to create challenge', type: 'error', isVisible: true });
      } else {
        setNotification({ message: `Challenge sent to ${username}! 🎮`, type: 'success', isVisible: true });
      }
    } catch (err) {
      setNotification({ message: 'Failed to create challenge', type: 'error', isVisible: true });
    } finally {
      setChallenging(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return <div className="feed-loading">Loading feed...</div>;
  }

  if (error) {
    return <div className="feed-error">Error: {error}</div>;
  }

  return (
    <div className="feed-container">
      <h2>🎮 Game Feed</h2>
      <div className="feed-entries">
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        />
        {feedEntries.length > 0 ? (
          feedEntries.map((entry) => (
            <div key={entry.id} className="feed-entry">
              <div className="feed-header">
                <span className="username">@{entry.username}</span>
                <span className="timestamp">{formatDate(entry.created_at)}</span>
              </div>
                              <div className="feed-content">
                  <div className="score-display">
                    <span className="score-label">Score:</span>
                    <span className="score-value">{entry.score}</span>
                  </div>
                  <div className="feed-message">
                    {console.log('Entry message:', entry.message, 'Type:', typeof entry.message)}
                    {entry.message ? entry.message : `Just achieved a score of ${entry.score}! 🎯`}
                  </div>
                  {currentUser && currentUser.id !== entry.user_id && (
                    <div className="feed-actions">
                      <button 
                        className="compete-btn"
                        onClick={() => handleChallenge(entry.user_id, entry.username)}
                        disabled={challenging[entry.user_id]}
                      >
                        {challenging[entry.user_id] ? 'Sending...' : 'Compete with User!'}
                      </button>
                    </div>
                  )}
                </div>
            </div>
          ))
        ) : (
          <div className="no-feed">
            <p>No feed entries yet. Play a game to see activity here!</p>
          </div>
        )}
      </div>
    </div>
  );
} 