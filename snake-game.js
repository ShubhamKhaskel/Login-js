class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('level');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');

        // Game settings
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.initialSpeed = 150;
        this.speed = this.initialSpeed;
        this.speedBoost = false;
        this.speedBoostDuration = 0;

        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.level = 1;
        this.foodEaten = 0;

        // Snake
        this.snake = [
            { x: 10, y: 10 }
        ];
        this.dx = 0;
        this.dy = 0;
        this.nextDx = 0;
        this.nextDy = 0;

        // Food
        this.food = [];
        this.foodTypes = [
            { type: 'regular', emoji: '🍎', points: 1, color: '#ff6b6b', probability: 0.7 },
            { type: 'bonus', emoji: '🍊', points: 3, color: '#ffa726', probability: 0.2 },
            { type: 'speed', emoji: '⚡', points: 1, color: '#66bb6a', probability: 0.1 }
        ];

        this.initializeGame();
        this.setupEventListeners();
        this.updateHighScore();
    }

    initializeGame() {
        this.spawnFood();
        this.draw();
        this.showStartScreen();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.key !== 'Enter' && e.key !== ' ') return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.dy === 0) {
                        this.nextDx = 0;
                        this.nextDy = -1;
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.dy === 0) {
                        this.nextDx = 0;
                        this.nextDy = 1;
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.dx === 0) {
                        this.nextDx = -1;
                        this.nextDy = 0;
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.dx === 0) {
                        this.nextDx = 1;
                        this.nextDy = 0;
                    }
                    break;
                case ' ':
                    this.togglePause();
                    break;
                case 'Enter':
                    if (!this.gameRunning) {
                        this.startGame();
                    }
                    break;
            }
        });

        // Button controls
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());

        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0 && this.dx === 0) {
                    this.nextDx = 1;
                    this.nextDy = 0;
                } else if (deltaX < 0 && this.dx === 0) {
                    this.nextDx = -1;
                    this.nextDy = 0;
                }
            } else {
                // Vertical swipe
                if (deltaY > 0 && this.dy === 0) {
                    this.nextDx = 0;
                    this.nextDy = 1;
                } else if (deltaY < 0 && this.dy === 0) {
                    this.nextDx = 0;
                    this.nextDy = -1;
                }
            }
        });
    }

    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.foodEaten = 0;
        this.speed = this.initialSpeed;
        this.speedBoost = false;
        this.speedBoostDuration = 0;

        // Reset snake
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.nextDx = 0;
        this.nextDy = 0;

        // Clear food and spawn new
        this.food = [];
        this.spawnFood();

        this.updateUI();
        this.hideOverlay();
        this.gameLoop();
    }

    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            this.showPauseScreen();
        } else {
            this.hideOverlay();
            this.gameLoop();
        }
    }

    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;

        this.update();
        this.draw();

        // Update speed boost
        if (this.speedBoost) {
            this.speedBoostDuration--;
            if (this.speedBoostDuration <= 0) {
                this.speedBoost = false;
                this.speed = this.initialSpeed / (1 + (this.level - 1) * 0.1);
            }
        }

        setTimeout(() => this.gameLoop(), this.speed);
    }

    update() {
        // Update direction
        this.dx = this.nextDx;
        this.dy = this.nextDy;

        // Move snake
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Check self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }

        // Check food collision
        let foodEaten = false;
        for (let i = this.food.length - 1; i >= 0; i--) {
            if (head.x === this.food[i].x && head.y === this.food[i].y) {
                this.eatFood(this.food[i]);
                this.food.splice(i, 1);
                foodEaten = true;
                break;
            }
        }

        // Add new head
        this.snake.unshift(head);

        // Remove tail if no food eaten
        if (!foodEaten) {
            this.snake.pop();
        }

        // Spawn new food if needed
        if (this.food.length < 3) {
            this.spawnFood();
        }

        // Level up
        if (this.foodEaten > 0 && this.foodEaten % 5 === 0) {
            this.levelUp();
        }
    }

    eatFood(foodItem) {
        this.score += foodItem.points;
        this.foodEaten++;

        // Apply food effects
        switch (foodItem.type) {
            case 'speed':
                this.speedBoost = true;
                this.speedBoostDuration = 50;
                this.speed = this.initialSpeed / 2;
                break;
        }

        this.updateUI();
        this.animateScore();
    }

    levelUp() {
        this.level++;
        this.speed = this.initialSpeed / (1 + (this.level - 1) * 0.1);
        this.updateUI();
        
        // Show level up message
        this.showLevelUpMessage();
    }

    spawnFood() {
        const attempts = 100;
        for (let i = 0; i < attempts; i++) {
            const x = Math.floor(Math.random() * this.tileCount);
            const y = Math.floor(Math.random() * this.tileCount);

            // Check if position is occupied by snake
            let occupied = false;
            for (let segment of this.snake) {
                if (segment.x === x && segment.y === y) {
                    occupied = true;
                    break;
                }
            }

            // Check if position is occupied by existing food
            for (let food of this.food) {
                if (food.x === x && food.y === y) {
                    occupied = true;
                    break;
                }
            }

            if (!occupied) {
                // Choose food type based on probability
                const rand = Math.random();
                let cumulative = 0;
                let selectedType = this.foodTypes[0];

                for (let type of this.foodTypes) {
                    cumulative += type.probability;
                    if (rand <= cumulative) {
                        selectedType = type;
                        break;
                    }
                }

                this.food.push({
                    x: x,
                    y: y,
                    type: selectedType.type,
                    emoji: selectedType.emoji,
                    points: selectedType.points,
                    color: selectedType.color
                });
                break;
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid (subtle)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Head
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.fillRect(segment.x * this.gridSize + 2, segment.y * this.gridSize + 2, 
                                this.gridSize - 4, this.gridSize - 4);
                
                // Eyes
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(segment.x * this.gridSize + 6, segment.y * this.gridSize + 6, 3, 3);
                this.ctx.fillRect(segment.x * this.gridSize + 11, segment.y * this.gridSize + 6, 3, 3);
            } else {
                // Body
                this.ctx.fillStyle = '#66BB6A';
                this.ctx.fillRect(segment.x * this.gridSize + 2, segment.y * this.gridSize + 2, 
                                this.gridSize - 4, this.gridSize - 4);
            }
        });

        // Draw food
        this.food.forEach(food => {
            // Draw background circle
            this.ctx.fillStyle = food.color;
            this.ctx.beginPath();
            this.ctx.arc(food.x * this.gridSize + this.gridSize / 2, 
                         food.y * this.gridSize + this.gridSize / 2, 
                         this.gridSize / 2 - 2, 0, 2 * Math.PI);
            this.ctx.fill();

            // Draw emoji
            this.ctx.font = `${this.gridSize - 4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(food.emoji, 
                             food.x * this.gridSize + this.gridSize / 2, 
                             food.y * this.gridSize + this.gridSize / 2);
        });

        // Draw speed boost indicator
        if (this.speedBoost) {
            this.ctx.fillStyle = 'rgba(102, 187, 106, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    gameOver() {
        this.gameRunning = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScore();
        }

        this.showGameOverScreen();
    }

    showStartScreen() {
        this.overlayTitle.textContent = '🐍 Snake Adventure';
        this.overlayMessage.textContent = 'Use arrow keys or WASD to move the snake. Eat food to grow and score points! Collect different food types for special effects.';
        this.startButton.style.display = 'inline-block';
        this.pauseButton.style.display = 'none';
        this.showOverlay();
    }

    showPauseScreen() {
        this.overlayTitle.textContent = '⏸️ Game Paused';
        this.overlayMessage.textContent = 'Press SPACE to resume or click the button below.';
        this.startButton.style.display = 'none';
        this.pauseButton.style.display = 'inline-block';
        this.showOverlay();
    }

    showGameOverScreen() {
        this.overlayTitle.textContent = '💀 Game Over';
        this.overlayMessage.textContent = `Final Score: ${this.score}\nLevel Reached: ${this.level}\nFood Eaten: ${this.foodEaten}`;
        this.startButton.textContent = 'Play Again';
        this.startButton.style.display = 'inline-block';
        this.pauseButton.style.display = 'none';
        this.showOverlay();
    }

    showLevelUpMessage() {
        const levelUpDiv = document.createElement('div');
        levelUpDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            color: #333;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 1000;
            animation: levelUp 1s ease-out;
        `;
        levelUpDiv.textContent = `🎉 Level ${this.level}! 🎉`;
        
        document.body.appendChild(levelUpDiv);
        
        setTimeout(() => {
            document.body.removeChild(levelUpDiv);
        }, 1000);
    }

    showOverlay() {
        this.overlay.style.display = 'flex';
    }

    hideOverlay() {
        this.overlay.style.display = 'none';
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
    }

    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }

    animateScore() {
        this.scoreElement.classList.add('updated');
        setTimeout(() => {
            this.scoreElement.classList.remove('updated');
        }, 300);
    }
}

// Add level up animation
const style = document.createElement('style');
style.textContent = `
    @keyframes levelUp {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});