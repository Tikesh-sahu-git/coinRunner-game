document.addEventListener('DOMContentLoaded', () => {
    // Loading screen elements
    const loadingScreen = document.getElementById('loading-screen');
    const loadingProgress = document.getElementById('loading-progress');
    
    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 10 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    initializeGame();
                }, 500);
            }, 500);
        }
        loadingProgress.textContent = `${Math.min(100, Math.floor(progress))}%`;
    }, 100);
    
    function initializeGame() {
        // Game elements
        const gameScreen = document.getElementById('game-screen');
        const character = document.getElementById('character');
        const scoreDisplay = document.getElementById('score');
        const levelDisplay = document.getElementById('level');
        const highScoreDisplay = document.getElementById('high-score');
        const gameOverScreen = document.getElementById('game-over');
        const finalScoreDisplay = document.getElementById('final-score');
        const finalLevelDisplay = document.getElementById('final-level');
        const levelUpScreen = document.getElementById('level-up');
        const newLevelDisplay = document.getElementById('new-level');
        const levelUpMessage = levelUpScreen.querySelector('p');
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        const jumpBtn = document.getElementById('jump-btn');
        
        // Game state
        let score = 0;
        let level = 1;
        let highScore = localStorage.getItem('highScore') || 0;
        let baseSpeed = 5;
        let gameSpeed = baseSpeed;
        let baseCharacterSpeed = 1;
        let characterSpeed = baseCharacterSpeed;
        let isJumping = false;
        let isGameRunning = false;
        let gameInterval;
        let spawnIntervals = [];
        let nextLevelThreshold = 100;
        let baseJumpHeight = 180;
        let baseJumpWidth = 5;
        
        // Fixed starting position
        const startPosition = 80;
        
        // Initialize character position
        character.style.left = startPosition + 'px';
        
        // Initialize
        highScoreDisplay.textContent = highScore;
        updateJumpParameters();
        
        // Event listeners
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        jumpBtn.addEventListener('click', jump);
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && isGameRunning) {
                e.preventDefault();
                jump();
            } else if (e.key === 'Enter' && !isGameRunning) {
                e.preventDefault();
                startGame();
            }
        });
        
        // Touch support for mobile
        gameScreen.addEventListener('touchstart', (e) => {
            if (isGameRunning) {
                e.preventDefault();
                jump();
            } else if (!isGameRunning && e.target === gameScreen) {
                startGame();
            }
        });
        
        function startGame() {
            // Reset game state
            resetGame();
            
            // Start game
            isGameRunning = true;
            gameOverScreen.style.display = 'none';
            levelUpScreen.style.display = 'none';
            
            // Reset character to starting position
            character.style.left = startPosition + 'px';
            
            // Start game loop
            gameInterval = setInterval(gameLoop, 20);
            
            // Start spawning elements
            spawnGameElements();
        }
        
        function gameLoop() {
            if (!isGameRunning) return;
            
            // Move character forward based on speed
            const currentPosition = parseInt(character.style.left);
            character.style.left = (currentPosition + characterSpeed) + 'px';
            
            // Move all coins and obstacles
            const coins = document.querySelectorAll('.coin');
            const obstacles = document.querySelectorAll('.obstacle');
            
            coins.forEach(coin => {
                moveElement(coin);
                if (checkCollision(character, coin)) {
                    collectCoin(coin);
                }
            });
            
            obstacles.forEach(obstacle => {
                moveElement(obstacle);
                if (checkCollision(character, obstacle)) {
                    endGame();
                }
            });
            
            // Check for level up
            if (score >= nextLevelThreshold) {
                levelUp();
            }
        }
        
        function moveElement(element) {
            const currentLeft = parseInt(element.style.left) || gameScreen.offsetWidth;
            const newLeft = currentLeft - gameSpeed;
            element.style.left = newLeft + 'px';
            
            // Remove if off screen
            if (newLeft < -parseInt(element.style.width || 30)) {
                element.remove();
            }
        }
        
        function spawnGameElements() {
            // Clear any existing intervals
            clearSpawnIntervals();
            
            // Calculate spawn times based on screen size
            const baseWidth = 800; // Reference width for scaling
            const widthRatio = Math.min(2, window.innerWidth / baseWidth);
            
            // Spawn coins
            const coinInterval = setInterval(() => {
                if (!isGameRunning) return;
                spawnCoin();
            }, getRandomTime(1000, 2000 - (level * 100)) / widthRatio);
            
            // Spawn obstacles
            const obstacleInterval = setInterval(() => {
                if (!isGameRunning) return;
                spawnObstacle();
            }, getRandomTime(1500, 2500 - (level * 100)) / widthRatio);
            
            spawnIntervals.push(coinInterval, obstacleInterval);
        }
        
        function spawnCoin() {
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.style.left = gameScreen.offsetWidth + 'px';
            
            // Random vertical position (60px to 60% of screen height)
            const minBottom = 60;
            const maxBottom = gameScreen.offsetHeight * 0.6;
            coin.style.bottom = `${minBottom + Math.random() * (maxBottom - minBottom)}px`;
            
            gameScreen.appendChild(coin);
        }
        
        function spawnObstacle() {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            
            // Obstacle size based on level and screen size
            const baseSize = Math.min(gameScreen.offsetWidth, gameScreen.offsetHeight);
            const height = baseSize * (0.05 + Math.random() * (0.05 + level * 0.01));
            const width = baseSize * (0.04 + Math.random() * (0.03 + level * 0.01));
            
            obstacle.style.width = width + 'px';
            obstacle.style.height = height + 'px';
            obstacle.style.left = gameScreen.offsetWidth + 'px';
            obstacle.style.bottom = parseInt(getComputedStyle(document.querySelector('.ground')).height) + 'px';
            
            gameScreen.appendChild(obstacle);
        }
        
        function jump() {
            if (isJumping || !isGameRunning) return;
            
            isJumping = true;
            character.classList.add('jump');
            
            setTimeout(() => {
                character.classList.remove('jump');
                isJumping = false;
            }, 800);
        }
        
        function checkCollision(element1, element2) {
            const rect1 = element1.getBoundingClientRect();
            const rect2 = element2.getBoundingClientRect();
            
            return (
                rect1.left < rect2.right &&
                rect1.right > rect2.left &&
                rect1.top < rect2.bottom &&
                rect1.bottom > rect2.top
            );
        }
        
        function collectCoin(coin) {
            score++;
            scoreDisplay.textContent = score;
            
            // Create score effect
            createScoreEffect(coin);
            
            // Remove coin
            coin.remove();
        }
        
        function createScoreEffect(element) {
            const effect = document.createElement('div');
            effect.className = 'score-effect';
            effect.textContent = '+1';
            effect.style.left = `${element.getBoundingClientRect().left + window.scrollX}px`;
            effect.style.top = `${element.getBoundingClientRect().top + window.scrollY}px`;
            document.body.appendChild(effect);
            
            // Remove after animation
            setTimeout(() => {
                effect.remove();
            }, 1000);
        }
        
        function updateJumpParameters() {
            const jumpHeight = baseJumpHeight + (level * 20); // Increase by 20px per level
            const jumpWidth = baseJumpWidth + (level * 2); // Increase rotation by 2deg per level
            
            document.documentElement.style.setProperty('--jump-height', `${jumpHeight}px`);
            document.documentElement.style.setProperty('--jump-width', `${jumpWidth}deg`);
            
            return { jumpHeight, jumpWidth };
        }
        
        function levelUp() {
            isGameRunning = false;
            clearInterval(gameInterval);
            clearSpawnIntervals();
            
            level++;
            levelDisplay.textContent = level;
            newLevelDisplay.textContent = level;
            
            // Increase difficulty
            gameSpeed = baseSpeed + (level * 0.5);
            characterSpeed = baseCharacterSpeed + (level * 0.2);
            nextLevelThreshold = score + 100 + (level * 20);
            
            // Update jump parameters
            const { jumpHeight, jumpWidth } = updateJumpParameters();
            
            // Update level up message
            levelUpMessage.textContent = `Jump Boost! Height: +${jumpHeight-baseJumpHeight}px, Tilt: +${jumpWidth-baseJumpWidth}°`;
            
            // Update character animation speed
            character.classList.remove('fast', 'faster');
            if (characterSpeed > 1.5) {
                character.classList.add('fast');
            } 
            if (characterSpeed > 2) {
                character.classList.add('faster');
            }
            
            // Show level up screen
            levelUpScreen.style.display = 'flex';
            
            // Continue after 2 seconds
            setTimeout(() => {
                levelUpScreen.style.display = 'none';
                isGameRunning = true;
                // Reset character to starting position
                character.style.left = startPosition + 'px';
                gameInterval = setInterval(gameLoop, 20);
                spawnGameElements();
            }, 2000);
        }
        
        function endGame() {
            isGameRunning = false;
            clearInterval(gameInterval);
            clearSpawnIntervals();
            
            // Update high score
            if (score > highScore) {
                highScore = score;
                highScoreDisplay.textContent = highScore;
                localStorage.setItem('highScore', highScore);
            }
            
            // Show game over screen
            finalScoreDisplay.textContent = score;
            finalLevelDisplay.textContent = level;
            gameOverScreen.style.display = 'flex';
        }
        
        function resetGame() {
            // Reset variables
            score = 0;
            level = 1;
            gameSpeed = baseSpeed;
            characterSpeed = baseCharacterSpeed;
            isJumping = false;
            
            // Update display
            scoreDisplay.textContent = score;
            levelDisplay.textContent = level;
            
            // Reset jump parameters
            updateJumpParameters();
            
            // Reset character to starting position and animation
            character.style.left = startPosition + 'px';
            character.classList.remove('jump', 'fast', 'faster');
            
            // Clear existing elements
            document.querySelectorAll('.coin, .obstacle, .score-effect').forEach(el => el.remove());
        }
        
        function clearSpawnIntervals() {
            spawnIntervals.forEach(interval => clearInterval(interval));
            spawnIntervals = [];
        }
        
        function getRandomTime(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (isGameRunning) {
                // Adjust character position
                const groundHeight = parseInt(getComputedStyle(document.querySelector('.ground')).height);
                character.style.bottom = groundHeight + 'px';
            }
        });
    }
});