import React from "react";
import "../styles/HomePage.css";

const HomePage = () => (
  <div className="minecraft-bg">
    <div className="minecraft-title">CrossQuest</div>
    <div className="minecraft-menu">
      <button className="minecraft-btn">Start Game</button>
      <button className="minecraft-btn">Options</button>
      <button className="minecraft-btn">Exit</button>
    </div>
  </div>
);

export default HomePage; 