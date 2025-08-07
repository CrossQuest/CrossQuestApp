import { useState, useEffect, useContext } from 'react';
import { getUserCompetitions, getPendingCompetitions, acceptCompetition, declineCompetition, completeCompetition } from '../adapters/score-adapters';
import UserContext from '../contexts/current-user-context';
import NotificationPopup from '../components/NotificationPopup';
import '../styles/competitions.css';

export default function CompetitionsPage() {
  const { currentUser } = useContext(UserContext);
  const [competitions, setCompetitions] = useState([]);
  const [pendingCompetitions, setPendingCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const [competitionsData, competitionsErr] = await getUserCompetitions();
        const [pendingData, pendingErr] = await getPendingCompetitions();
        
        if (competitionsErr || pendingErr) {
          setError('Failed to load competitions');
        } else {
          setCompetitions(competitionsData);
          setPendingCompetitions(pendingData);
        }
      } catch (err) {
        setError('Failed to load competitions');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchCompetitions();
    }
  }, [currentUser]);

  const handleAccept = async (competitionId) => {
    try {
      const [data, err] = await acceptCompetition(competitionId);
      if (err) {
        setNotification({ message: 'Failed to accept challenge', type: 'error', isVisible: true });
      } else {
        setNotification({ message: 'Challenge accepted! The competition is now active. 🏆', type: 'success', isVisible: true });
        // Refresh competitions
        const [competitionsData] = await getUserCompetitions();
        const [pendingData] = await getPendingCompetitions();
        setCompetitions(competitionsData);
        setPendingCompetitions(pendingData);
      }
    } catch (err) {
      setNotification({ message: 'Failed to accept challenge', type: 'error', isVisible: true });
    }
  };

  const handleDecline = async (competitionId) => {
    try {
      const [data, err] = await declineCompetition(competitionId);
      if (err) {
        setNotification({ message: 'Failed to decline challenge', type: 'error', isVisible: true });
      } else {
        setNotification({ message: 'Challenge declined.', type: 'info', isVisible: true });
        // Refresh competitions
        const [competitionsData] = await getUserCompetitions();
        const [pendingData] = await getPendingCompetitions();
        setCompetitions(competitionsData);
        setPendingCompetitions(pendingData);
      }
    } catch (err) {
      setNotification({ message: 'Failed to decline challenge', type: 'error', isVisible: true });
    }
  };

  const handleComplete = async (competitionId) => {
    try {
      const [data, err] = await completeCompetition(competitionId);
      if (err) {
        setNotification({ message: 'Failed to complete competition', type: 'error', isVisible: true });
      } else {
        setNotification({ message: `Competition completed! Winner: ${data.winner} 🏆`, type: 'success', isVisible: true });
        // Refresh competitions
        const [competitionsData] = await getUserCompetitions();
        setCompetitions(competitionsData);
      }
    } catch (err) {
      setNotification({ message: 'Failed to complete competition', type: 'error', isVisible: true });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!currentUser) {
    return <div className="competitions-error">Please log in to view competitions.</div>;
  }

  if (loading) {
    return <div className="competitions-loading">Loading competitions...</div>;
  }

  if (error) {
    return <div className="competitions-error">Error: {error}</div>;
  }

  return (
    <div className="competitions-container">
      <h2>⚔️ Competitions</h2>
      <NotificationPopup
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
      
      {/* Pending Challenges */}
      <div className="competitions-section">
        <h3>Pending Challenges</h3>
        {pendingCompetitions.length > 0 ? (
          <div className="competitions-list">
            {pendingCompetitions.map((competition) => (
              <div key={competition.id} className="competition-card pending">
                <div className="competition-header">
                  <span className="competition-type">Challenge</span>
                  <span className="competition-date">{formatDate(competition.created_at)}</span>
                </div>
                <div className="competition-content">
                  <p>
                    <strong>{competition.challenger_username}</strong> challenged{' '}
                    <strong>{competition.challenged_username}</strong>
                  </p>
                  {competition.challenged_id === currentUser.id && (
                    <div className="competition-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => handleAccept(competition.id)}
                      >
                        ✅ Accept
                      </button>
                      <button 
                        className="decline-btn"
                        onClick={() => handleDecline(competition.id)}
                      >
                        ❌ Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-competitions">No pending challenges.</p>
        )}
      </div>

      {/* Active/Completed Competitions */}
      <div className="competitions-section">
        <h3>All Competitions</h3>
        {competitions.length > 0 ? (
          <div className="competitions-list">
            {competitions.map((competition) => (
              <div key={competition.id} className={`competition-card ${competition.status}`}>
                <div className="competition-header">
                  <span className={`competition-status ${competition.status}`}>
                    {competition.status.toUpperCase()}
                  </span>
                  <span className="competition-date">{formatDate(competition.created_at)}</span>
                </div>
                <div className="competition-content">
                  <div className="competition-players">
                    <div className="player">
                      <strong>{competition.challenger_username}</strong>
                      <span className="score">{competition.challenger_score}</span>
                    </div>
                    <div className="vs">VS</div>
                    <div className="player">
                      <strong>{competition.challenged_username}</strong>
                      <span className="score">{competition.challenged_score}</span>
                    </div>
                  </div>
                  
                  {competition.status === 'active' && (
                    <div className="competition-actions">
                      <button 
                        className="complete-btn"
                        onClick={() => handleComplete(competition.id)}
                      >
                        🏁 Complete
                      </button>
                    </div>
                  )}
                  
                  {competition.status === 'completed' && competition.winner && (
                    <div className="competition-result">
                      <strong>Winner: {competition.winner}</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-competitions">No competitions yet.</p>
        )}
      </div>
    </div>
  );
} 