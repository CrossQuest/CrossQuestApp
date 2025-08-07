import { submitScore, getActiveCompetitions, submitCompetitionScore, getUserAttempts } from '../adapters/score-adapters';
import { useContext, useState } from 'react';
import UserContext from '../contexts/current-user-context';
import WinnerPopup from './WinnerPopup';
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const GRID_SIZE = 40;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

const rowColors = {
  safe: 0xede0cb,
  road: 0x333333,
  water: 0x000022,
};

let highScore = 0;

export default function PhaserGame() {
  const { currentUser } = useContext(UserContext);
  const gameRef = useRef(null);
  const [winnerData, setWinnerData] = useState(null);
  const gameInstanceRef = useRef(null);

  useEffect(() => {
    console.log('PhaserGame useEffect running');
    console.log('gameRef.current:', gameRef.current);
    
    // Destroy any existing game instance first
    if (gameInstanceRef.current) {
      console.log('Destroying existing game instance');
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
    }

    // Create the scene inside the component
    const gameScene = new Phaser.Scene("Game");
    console.log('Created game scene:', gameScene);

    // This function is called when the scene starts.
    // It initializes variables for the new game.
    gameScene.init = function (data) {
      console.log('Scene init called');
      this.gameState = "start";
      this.score = 0;
      this.furthestRow = 0;
      this.lastGeneratedRow = 0;
      this.levelLayout = [];
      this.isPlayerDead = false;
      this.currentUser = currentUser; // Pass currentUser to the scene
      this.setWinnerData = setWinnerData; // Pass setWinnerData to the scene
      this.activeCompetition = null; // Track active competition

      if (data && data.highScore) {
        highScore = data.highScore;
      }

      // Check for active competitions
      if (currentUser) {
        getActiveCompetitions()
        .then(([competitions, err]) => {
          if (!err && competitions && competitions.length > 0) {
            this.activeCompetition = competitions[0]; // Use the first active competition
            console.log('Active competition found:', this.activeCompetition);
          }
        });
      }
    };

    // Preload game assets like images and textures.
    gameScene.preload = function () {
      console.log('Scene preload called');
      // Generate player texture if it doesn't exist
      if (!this.textures.exists("player")) {
        const pixelData = [
          ".......H.......",
          "......HHH......",
          "......HHH......",
          ".....HSSSH.....",
          "....SSSSSSS....",
          "....SES.SES....",
          "....SSSSSSS....",
          "......BBB......",
          ".....BBBBB.....",
          "....BBBBBBB....",
          "....B.BBB.B....",
          "......PPP......",
          "......PPP......",
          ".....P...P.....",
          ".....P...P.....",
          "...............",
        ];
        this.textures.generate("player", {
          data: pixelData,
          pixelWidth: 2,
          palette: {
            ".": "#00000000",
            H: "#191818ff",
            S: "#663931",
            E: "#f3f3f3ff",
            B: "#4169e1",
            P: "#333333",
          },
        });
      }

      // Generate bug texture
      if (!this.textures.exists("bug")) {
        const bugData = [
          "..RRRR..",
          ".RWWWRR.",
          "RWWWRRRR",
          "RRRRRRRR",
          "RRRRRRRR",
          "RWWWRRRR",
          ".RWWWRR.",
          "..RRRR..",
        ];
        this.textures.generate("bug", {
          data: bugData,
          pixelWidth: 4,
          palette: { ".": "#00000000", R: "#ff4136", W: "#ffffff" },
        });
      }

      // Generate log texture
      if (!this.textures.exists("log")) {
        const logData = [
          "..DDDDDDDDDDDDDD..",
          ".DMMLLMMLLMMLLMMD.",
          ".DLMLDMLLDMLMLDMD.",
          ".DMLLMMLDLMLMMLLD.",
          ".DMMLLMLMLDMLLMMD.",
          "..DDDDDDDDDDDDDD..",
        ];
        this.textures.generate("log", {
          data: logData,
          pixelWidth: 3,
          palette: { ".": "#00000000", D: "#663931", M: "#8d5524", L: "#c68642" },
        });
      }
    };

    // Create game objects and set up the initial state.
    gameScene.create = function () {
      console.log('Scene create called');
      this.charSet =
        "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789";

      // Create groups to manage game objects
      this.bugs = this.physics.add.group({
        defaultKey: "bug",
        classType: Phaser.Physics.Arcade.Sprite,
      });
      this.logs = this.physics.add.group({
        defaultKey: "log",
        classType: Phaser.Physics.Arcade.Sprite,
      });
      this.tiles = this.add.group();
      this.rainRows = this.add.group();

      // The game world is now the size of the screen.
      this.physics.world.setBounds(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      this.cameras.main.setBounds(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      // Generate enough rows to fill the screen initially.
      generateRows.call(this, Math.floor(SCREEN_HEIGHT / GRID_SIZE) + 1);

      // --- PLAYER SETUP ---
      this.startX = SCREEN_WIDTH / 2;
      // Start player at the bottom of the screen (on the second to last row).
      const startingRow = Math.floor(SCREEN_HEIGHT / GRID_SIZE) - 1;
      this.startY = startingRow * GRID_SIZE + GRID_SIZE / 2;
      this.furthestRow = startingRow; // Set initial furthest row for scoring.

      this.player = this.physics.add
        .sprite(this.startX, this.startY, "player")
        .setOrigin(0.5)
        .setDisplaySize(GRID_SIZE * 0.8, GRID_SIZE * 0.8)
        .setDepth(10);

      this.scoreText = this.add
        .text(16, 16, `Score: 0\nHigh: ${highScore}`, {
          fontSize: "24px",
          fill: "#fff",
          fontFamily: '"Press Start 2P"',
          stroke: "#000",
          strokeThickness: 4,
        })
        .setScrollFactor(0)
        .setDepth(20);

      // Add competition indicator if there's an active competition
      if (this.activeCompetition) {
        this.competitionText = this.add
          .text(16, 80, `⚔️ COMPETITION ACTIVE!\nBeat your opponent!`, {
            fontSize: "16px",
            fill: "#ff6b6b",
            fontFamily: '"Press Start 2P"',
            stroke: "#000",
            strokeThickness: 3,
          })
          .setScrollFactor(0)
          .setDepth(20);
      }

      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys("W,A,S,D");

      // Physics overlap checks
      this.physics.add.overlap(this.player, this.bugs, playerHit, null, this);

      const titleStyle = {
        fontSize: "56px",
        fill: "#fff",
        fontFamily: '"Press Start 2P"',
        stroke: "#00000000",
        strokeThickness: 8,
      };

      const buttonTextStyle = {
        fontSize: "40px",
        fill: "#fff",
        fontFamily: '"Press Start 2P"',
        stroke: "#00000000",
        strokeThickness: 6,
      };

      const gameOverStyle = {
        ...titleStyle,
        fontSize: "32px",
        align: "center",
        strokeThickness: 6,
      };

      this.titleText = this.add
        .text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100, "CrossQuest", titleStyle)
        .setOrigin(0.5)
        .setDepth(30);

      const playButtonText = this.add
        .text(0, 0, "Play", buttonTextStyle)
        .setOrigin(0.5);

      const playButtonBg = this.add
        .rectangle(
          0,
          0,
          playButtonText.width + 40,
          playButtonText.height + 20,
          0x800080
        )
        .setStrokeStyle(4, 0x000000);

      this.playButton = this.add.container(
        SCREEN_WIDTH / 2,
        SCREEN_HEIGHT / 2 + 50,
        [playButtonBg, playButtonText]
      );

      this.playButton
        .setSize(playButtonBg.width, playButtonBg.height)
        .setDepth(30)
        .setInteractive();

      this.gameOverText = this.add
        .text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100, "", gameOverStyle)
        .setOrigin(0.5)
        .setDepth(30)
        .setVisible(false);

      const rewindButtonText = this.add
        .text(0, 0, "Try Again", buttonTextStyle)
        .setOrigin(0.5);

      const rewindButtonBg = this.add
        .rectangle(
          0,
          0,
          rewindButtonText.width + 40,
          rewindButtonText.height + 20,
          0x800080
        )
        .setStrokeStyle(4, 0x000000);

      this.rewindButton = this.add.container(
        SCREEN_WIDTH / 2,
        SCREEN_HEIGHT / 2 + 50,
        [rewindButtonBg, rewindButtonText]
      );

      this.rewindButton
        .setSize(rewindButtonBg.width, rewindButtonBg.height)
        .setDepth(30)
        .setVisible(false)
        .setInteractive();

      this.playButton.on("pointerdown", () => {
        this.titleText.setVisible(false);
        this.playButton.setVisible(false);
        this.gameState = "playing";
        this.player.setPosition(SCREEN_WIDTH / 2, this.startY);
        this.isPlayerDead = false;
      });
      this.playButton.on("pointerover", () => playButtonBg.setFillStyle(0x9932cc));
      this.playButton.on("pointerout", () => playButtonBg.setFillStyle(0x800080));

      this.rewindButton.on("pointerdown", () => {
        this.scene.restart({ highScore: highScore });
      });
      this.rewindButton.on("pointerover", () =>
        rewindButtonBg.setFillStyle(0x9932cc)
      );
      this.rewindButton.on("pointerout", () =>
        rewindButtonBg.setFillStyle(0x800080)
      );

      this.cameras.main.fadeIn(250, 0, 0, 0);
    };

    // The main game loop, called every frame.
    gameScene.update = function (time, delta) {
      if (this.isPlayerDead) return;

      updateHorizontalRain.call(this, time, delta);

      // Don't allow new movement until the current tween is finished.
      if (this.tweens.isTweening(this.player)) return;

      // Check if the player is on a log to move them with it.
      let onLog = null;
      this.physics.world.overlap(this.player, this.logs, (player, log) => {
        onLog = log;
      });

      if (onLog) {
        this.player.x += onLog.body.velocity.x * (delta / 1000);
      }

      handlePlayerMovement.call(this);

      if (this.player.x < 0 || this.player.x > SCREEN_WIDTH) {
        playerHit.call(this);
      }

      // Wrap obstacles that go off-screen.
      wrapGameObject.call(this, this.bugs);
      wrapGameObject.call(this, this.logs);
    };

    // This function clears the screen and generates a new set of rows.
    gameScene.resetLevel = function () {
      console.log('Resetting level');
      // 1. Clear all old objects to make way for the new ones.
      this.tiles.clear(true, true);
      this.bugs.clear(true, true);
      this.logs.clear(true, true);
      this.rainRows.clear(true, true);

      // 2. Reset tracking variables.
      this.levelLayout = [];
      this.lastGeneratedRow = 0;

      // 3. Generate a new set of rows to fill the screen.
      generateRows.call(this, Math.floor(SCREEN_HEIGHT / GRID_SIZE) + 1);

      // 4. Reset player position to the bottom of the new screen.
      const startingRow = Math.floor(SCREEN_HEIGHT / GRID_SIZE) - 1;
      this.player.y = startingRow * GRID_SIZE + GRID_SIZE / 2;
      this.player.x = SCREEN_WIDTH / 2;
      // Reset the furthest row for the new level.
      this.furthestRow = startingRow;
    };

    // Only create the game if it doesn't exist
    console.log('Creating new Phaser game instance');
    const config = {
      type: Phaser.AUTO,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: "#f9e4bc",
      pixelArt: true,
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 } },
      },
      scene: gameScene,
      parent: gameRef.current, // Explicitly set the parent element
    };
    
    console.log('Phaser config:', config);
    
    try {
      gameInstanceRef.current = new Phaser.Game(config);
      console.log('Phaser game created successfully');
      
      // Check if canvas was created
      setTimeout(() => {
        const canvas = document.querySelector('canvas');
        console.log('Canvas found:', canvas);
        if (canvas) {
          console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
          console.log('Canvas style:', canvas.style.cssText);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error creating Phaser game:', error);
    }

    // Cleanup function to destroy the game when component unmounts
    return () => {
      console.log('PhaserGame cleanup running');
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
        console.log('Phaser game destroyed');
      }
    };
  }, []);

  console.log('PhaserGame component rendering');

  return (
    <div>
      <div 
        ref={gameRef} 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f9e4bc',
          position: 'relative',
        }}
      />
      {winnerData && (
        <WinnerPopup
          winner={winnerData.winner}
          challenger={winnerData.challenger}
          challenged={winnerData.challenged}
          challengerScore={winnerData.challengerScore}
          challengedScore={winnerData.challengedScore}
          onClose={() => setWinnerData(null)}
        />
      )}
    </div>
  );
}

// Helper functions
function getDifficultySetting(score) {
  if (score > 50) {
    return { speedMultiplier: 1.8, objectMultiplier: 1.5, hazardChance: 0.85 };
  } else if (score > 30) {
    return { speedMultiplier: 1.5, objectMultiplier: 1.2, hazardChance: 0.8 };
  } else if (score > 15) {
    return { speedMultiplier: 1.2, objectMultiplier: 1.1, hazardChance: 0.75 };
  }

  return { speedMultiplier: 1.0, objectMultiplier: 1.0, hazardChance: 0.7 };
}

// Generates the rows (safe, road, water) for the level.
function generateRows(numRows) {
  // --- NEW: Define player starting row to ensure it's always safe ---
  const playerStartRow = Math.floor(SCREEN_HEIGHT / GRID_SIZE) - 1;

  const difficulty = getDifficultySetting(this.score);

  for (let i = 0; i < numRows; i++) {
    const y = this.lastGeneratedRow * GRID_SIZE + GRID_SIZE / 2;
    let type = "safe";
    const isPlayerRow = this.lastGeneratedRow === playerStartRow;
    const isInitialSafeZone = this.lastGeneratedRow < 3;

    if (!isPlayerRow && !isInitialSafeZone) {
      const rand = Math.random();
      if (rand < difficulty.hazardChance) {
        type = Math.random() < 0.6 ? "road" : "water";
      }
    }

    this.levelLayout.push(type);
    const tile = this.add
      .rectangle(SCREEN_WIDTH / 2, y, SCREEN_WIDTH, GRID_SIZE, rowColors[type])
      .setOrigin(0.5);
    this.tiles.add(tile);

    if (type === "water") {
      const numTextRows = 3;
      const direction = Math.random() < 0.5 ? 1 : -1;

      const baseSpeed =
        (Math.random() * 0.5 + 0.5) * 40 * difficulty.speedMultiplier;
      for (let j = 0; j < numTextRows; j++) {
        const charsToFill = Math.ceil(SCREEN_WIDTH / 8);
        let text = "";
        for (let k = 0; k < charsToFill; k++) {
          text += Phaser.Math.RND.pick(this.charSet);
        }
        const yOffset = j * (GRID_SIZE / numTextRows) - GRID_SIZE / 2 + 10;
        const textY = y + yOffset;
        const speed = baseSpeed + Math.random() * 20;
        let textRow = this.add
          .text(0, textY, text, {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#00ff00",
          })
          .setOrigin(0, 0.5);
        textRow.setData({
          speed: speed * direction,
          updateCounter: Math.random() * 100,
        });
        this.rainRows.add(textRow);
      }
    }

    if (type === "road" || type === "water") {
      const direction = Math.random() < 0.5 ? 1 : -1;
      const speed = (Math.random() * 1 + 0.5) * 70 * difficulty.speedMultiplier;
      const objectCount = Math.floor(
        (Math.random() * 2 + 2) * difficulty.objectMultiplier
      );

      for (let j = 0; j < objectCount; j++) {
        const spacing = (SCREEN_WIDTH * 1.5) / objectCount;
        let x = j * spacing + (Math.random() * GRID_SIZE * 2 - GRID_SIZE);
        x = direction === 1 ? x - SCREEN_WIDTH * 0.25 : x + SCREEN_WIDTH * 1.25;
        let obstacle =
          type === "road" ? this.bugs.get(x, y) : this.logs.get(x, y);
        if (obstacle) {
          obstacle.setActive(true).setVisible(true);
          obstacle.body.enable = true;
          obstacle.setVelocityX(speed * direction);
          obstacle.setDisplaySize(
            type === "road" ? GRID_SIZE * 0.9 : GRID_SIZE * 3,
            GRID_SIZE * 0.9
          );
        }
      }
    }
    this.lastGeneratedRow++;
  }
}

// Animates the "digital rain" effect on water tiles.
function updateHorizontalRain(time, delta) {
  this.rainRows.getChildren().forEach((row) => {
    if (!row.active) return;
    row.x += row.getData("speed") * (delta / 1000);
    const speed = row.getData("speed");
    if (speed > 0 && row.x > 0) row.x = -row.width / 2;
    else if (speed < 0 && row.x < -row.width / 2) row.x = 0;

    let counter = row.getData("updateCounter") + delta;
    if (counter > 80) {
      counter = 0;
      const textLength = row.text.length;
      const startIndex = Math.floor(Math.random() * textLength);
      const newChar = Phaser.Math.RND.pick(this.charSet);
      row.text =
        row.text.substring(0, startIndex) +
        newChar +
        row.text.substring(startIndex + 1);
    }
    row.setData("updateCounter", counter);
  });
}

// Handles all player movement and scoring logic.
function handlePlayerMovement() {
  let targetX = this.player.x;
  let targetY = this.player.y;
  let moved = false;
  let movedUp = false;

  const currentRow = Math.floor(this.player.y / GRID_SIZE);
  const bottomRow = Math.floor(SCREEN_HEIGHT / GRID_SIZE) - 1;

  if (
    Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
    Phaser.Input.Keyboard.JustDown(this.wasdKeys.W)
  ) {
    targetY -= GRID_SIZE;
    moved = true;
    movedUp = true;
  } else if (
    (Phaser.Input.Keyboard.JustDown(this.cursors.down) ||
      Phaser.Input.Keyboard.JustDown(this.wasdKeys.S)) &&
    currentRow < bottomRow
  ) {
    targetY += GRID_SIZE;
    moved = true;
  } else if (
    Phaser.Input.Keyboard.JustDown(this.cursors.left) ||
    Phaser.Input.Keyboard.JustDown(this.wasdKeys.A)
  ) {
    targetX -= GRID_SIZE;
    moved = true;
  } else if (
    Phaser.Input.Keyboard.JustDown(this.cursors.right) ||
    Phaser.Input.Keyboard.JustDown(this.wasdKeys.D)
  ) {
    targetX += GRID_SIZE;
    moved = true;
  }

  if (moved) {
    // --- NEW: Level Reset Logic ---
    // If the player is on the top row (row 0) and tries to move up again, reset the level.
    if (movedUp) {
      const currentPosRow = Math.floor(this.player.y / GRID_SIZE);
      if (currentPosRow === 0) {
        this.resetLevel();
        return; // Exit to prevent the move, the reset handles everything.
      }
    }

    // Clamp X movement to the screen. Y is handled by world bounds.
    targetX = Phaser.Math.Clamp(
      targetX,
      GRID_SIZE / 2,
      SCREEN_WIDTH - GRID_SIZE / 2
    );

    // Animate the player's movement to the target position.
    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      ease: "Power1",
      duration: 150,
      onComplete: () => {
        const currentRow = Math.floor(this.player.y / GRID_SIZE);

        // Score increases as the player moves up to a new "furthest" row.
        if (currentRow < this.furthestRow) {
          if (this.score < 9999) {
            this.score++;
          }
          this.furthestRow = currentRow;
          if (this.score > highScore) {
            highScore = this.score;
          }
          this.scoreText.setText(`Score: ${this.score}\nHigh: ${highScore}`);
        }
        // Check if the player landed in water after the move.
        checkLanding.call(this);
      },
    });
  }
}

// Checks what the player landed on (e.g., water).
function checkLanding() {
  const currentRowIndex = Math.floor(this.player.y / GRID_SIZE);
  if (currentRowIndex < 0 || currentRowIndex >= this.levelLayout.length) return;

  const currentTileType = this.levelLayout[currentRowIndex];
  if (currentTileType === "water") {
    let isSafeOnLog = false;
    // Check for overlap with any logs.
    this.physics.world.overlap(this.player, this.logs, () => {
      isSafeOnLog = true;
    });
    if (!isSafeOnLog) {
      playerHit.call(this); // Player is in the water!
    }
  }
}

// Called when the player is hit by a bug or falls in the water.
function playerHit() {
  if (this.isPlayerDead) return;
  this.isPlayerDead = true;

  if (this.gameState !== "playing") {
    return;
  }

  this.gameState = "gameOver";
  this.cameras.main.shake(250, 0.01);

  this.gameOverText.setText(`Congratulations!\nScore: ${this.score}`);
  this.gameOverText.setVisible(true);
  this.rewindButton.setVisible(true);

  if (this.currentUser && this.score > 0){
    console.log('Player hit - currentUser:', this.currentUser, 'score:', this.score);
    // Submit score to posts (for leaderboard)
    submitScore({ score: this.score })
    .then(([data, err]) => {
      if(err){
        console.error('Failed to submit score', err);
      } else {
        console.log('Score submitted successfully', data);
      }
    })
    .catch(err => {
      console.error('Error submitting score:', err);
    });



    // Submit score to active competitions
    getActiveCompetitions()
    .then(([competitions, err]) => {
      console.log('Active competitions:', competitions, 'Error:', err);
      if (!err && competitions && competitions.length > 0) {
        // Check attempts and submit score to each active competition
        competitions.forEach(competition => {
          console.log('Checking attempts for competition', competition.id);
          getUserAttempts(competition.id)
            .then(([attemptsData, attemptsErr]) => {
              if (attemptsErr) {
                console.error('Failed to get attempts for competition', competition.id, attemptsErr);
                return;
              }
              
                             console.log('Attempts data:', attemptsData);
               console.log('Remaining attempts:', attemptsData.remaining);
               if (attemptsData.remaining > 0) {
                console.log('Submitting score', this.score, 'to competition', competition.id);
                submitCompetitionScore(competition.id, this.score)
                  .then(([data, compErr]) => {
                    if (compErr) {
                      console.error('Failed to submit competition score', compErr);
                      if (compErr.message && compErr.message.includes('3 attempts')) {
                        alert('You have already used all 3 attempts in this competition!');
                      }
                                         } else {
                       console.log('Competition score submitted successfully', data);
                       console.log('Competition data received:', data);
                       
                       // Check if competition was completed (auto-completed after 3 attempts)
                       if (data && data.status === 'completed' && data.winner) {
                         console.log('Competition completed! Winner:', data.winner);
                         this.setWinnerData({
                           winner: data.winner,
                           challenger: data.challenger_username,
                           challenged: data.challenged_username,
                           challengerScore: data.challenger_score,
                           challengedScore: data.challenged_score
                         });
                       } else {
                         console.log('Competition not completed yet - status:', data.status, 'winner:', data.winner);
                       }
                     }
                  });
                             } else {
                 console.log('No attempts remaining for competition', competition.id);
                 console.log('User has used all', attemptsData.attempts, 'attempts out of', attemptsData.maxAttempts);
               }
            });
        });
      } else {
        console.log('No active competitions found');
      }
    });
  }
}

// Wraps objects (bugs, logs) from one side of the screen to the other.
function wrapGameObject(group) {
  group.getChildren().forEach((go) => {
    // Wrap from right to left
    if (go.body.velocity.x > 0 && go.x > SCREEN_WIDTH + go.displayWidth / 2) {
      go.x = -go.displayWidth / 2;
    }
    // Wrap from left to right
    else if (go.body.velocity.x < 0 && go.x < -go.displayWidth / 2) {
      go.x = SCREEN_WIDTH + go.displayWidth / 2;
    }
  });
} 