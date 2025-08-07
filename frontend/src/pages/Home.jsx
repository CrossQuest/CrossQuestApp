import '../styles/home.css';
import PhaserGame from '../components/PhaserGame';

export default function GamePage() {
  return (
    <div className="home-container">
      <div className="game-wrapper">
        <div className="game-content">
          <PhaserGame />
        </div>
      </div>
    </div>
  );
}
