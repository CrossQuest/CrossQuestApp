import '../styles/winner-popup.css';

export default function WinnerPopup({ winner, challenger, challenged, challengerScore, challengedScore, onClose }) {
  const isTie = winner === "Tie";
  const noWinner = winner === "No winner";
  
  return (
    <div className="winner-popup-overlay">
      <div className="winner-popup">
        <div className="winner-popup-header">
          <h2>🏆 Competition Complete!</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="winner-popup-content">
          {isTie ? (
            <div className="winner-result tie">
              <h3>🤝 It's a Tie!</h3>
              <p>Both players scored {challengerScore} points</p>
            </div>
          ) : noWinner ? (
            <div className="winner-result no-winner">
              <h3>😔 No Winner</h3>
              <p>Neither player scored any points</p>
            </div>
          ) : (
            <div className="winner-result">
              <h3>🎉 Winner: {winner}</h3>
              <div className="final-scores">
                <div className="score-card winner">
                  <span className="player-name">{challenger}</span>
                  <span className="score">{challengerScore}</span>
                </div>
                <div className="vs">VS</div>
                <div className="score-card">
                  <span className="player-name">{challenged}</span>
                  <span className="score">{challengedScore}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="winner-popup-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 