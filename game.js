// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 5;
const CAMERA_OFFSET_X = 300; // Distance from left where player should stay
const LEVEL_WIDTH = 3000; // Total level width

// Add level configurations
const LEVELS = [
    {
        platforms: [
            [0, 350, 3000, 50], // Ground
            [300, 250, 200, 20],
            [600, 200, 200, 20],
            [900, 250, 200, 20],
            [1200, 150, 200, 20],
            [1500, 250, 200, 20],
            [1800, 200, 200, 20],
            [2100, 250, 200, 20],
            [2400, 150, 200, 20],
        ],
        enemies: [
            [400, 300],
            [800, 300],
            [1200, 100],
            [1600, 200],
            [2000, 300],
        ],
        coins: [
            [350, 200],
            [400, 200],
            [450, 200],
            [800, 150],
            [850, 150],
            [1200, 100],
            [1250, 100],
            [1600, 200],
            [1650, 200],
            [2000, 150],
        ],
        endX: 2800 // Level end position
    },
    {   // Level 2
        platforms: [
            [0, 350, 3000, 50],
            [300, 300, 100, 20],
            [500, 250, 100, 20],
            [700, 200, 100, 20],
            [900, 150, 100, 20],
            [1200, 200, 200, 20],
            [1500, 150, 200, 20],
            [1800, 250, 200, 20],
            [2100, 200, 200, 20],
            [2400, 150, 200, 20],
        ],
        enemies: [
            [400, 250],
            [900, 100],
            [1400, 100],
            [1800, 200],
            [2200, 250],
            [2500, 100],
        ],
        coins: [
            [350, 200],
            [400, 200],
            [450, 200],
            [800, 150],
            [850, 150],
            [1200, 100],
            [1250, 100],
            [1600, 200],
            [1650, 200],
            [2000, 150],
        ],
        endX: 2800
    }
];

// Add these constants at the top
const COLORS = {
    sky: 'linear-gradient(180deg, #1e90ff 0%, #87ceeb 100%)',
    ground: 'linear-gradient(0deg, #3d2817 0%, #5c3a21 100%)',
    platform: 'linear-gradient(0deg, #2e7d32 0%, #4caf50 100%)',
    player: '#ff4444',
    enemy: '#722',
    flag: '#ffd700',
    ui: {
        text: '#ffffff',
        shadow: '#000000',
        overlay: 'rgba(0, 0, 0, 0.7)',
        button: '#4CAF50',
        buttonHover: '#45a049'
    },
    coin: {
        outer: '#FFD700',
        inner: '#FFA500',
        shine: '#FFFFFF'
    }
};

// Add these at the top of the file with other constants
const ASSETS = {
    hero: null,
    enemy: null
};

// Add at the top with other constants
const DEBUG = false;

// Add to the top with other constants
const ANIMATION_STATES = {
    IDLE: 'idle',
    WALKING: 'walking',
    JUMPING: 'jumping'
};

// Add this function to load SVG files
function loadSVG(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// Add particle system
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createParticle(x, y, color) {
        return {
            x, y,
            color,
            size: Math.random() * 3 + 1, // Smaller particles
            speedX: (Math.random() - 0.5) * 4,
            speedY: -Math.random() * 4 - 2, // Always move up
            life: 1.0
        };
    }

    addParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(x, y, color));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += 0.1; // Add gravity to particles
            p.life -= 0.05; // Faster fade out
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); // Shrink as they fade
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

// Add this function at the top level to generate random platforms and enemies
function generateRandomLevel(levelNumber) {
    const platformCount = 10 + Math.floor(levelNumber * 0.5); // More platforms in higher levels
    const enemyCount = 5 + Math.floor(levelNumber * 0.3); // More enemies in higher levels
    
    const platforms = [
        // Always include ground platform
        [0, 350, 3000, 50]
    ];

    // Generate random platforms
    for (let i = 0; i < platformCount; i++) {
        const x = 300 + Math.random() * 2400; // Spread across level
        const y = 150 + Math.random() * 150; // Vary height
        const width = 100 + Math.random() * 150; // Random width
        platforms.push([x, y, width, 20]);
    }

    // Generate random enemies
    const enemies = [];
    for (let i = 0; i < enemyCount; i++) {
        const x = 400 + Math.random() * 2200;
        const y = 100 + Math.random() * 200;
        enemies.push([x, y]);
    }

    // Generate coins
    const coins = [];
    const coinCount = 15 + Math.floor(levelNumber * 0.5); // More coins in higher levels
    
    for (let i = 0; i < coinCount; i++) {
        const x = 300 + Math.random() * 2400;
        const y = 100 + Math.random() * 200;
        coins.push([x, y]);
    }

    return {
        platforms,
        enemies,
        coins,  // Add coins to level data
        endX: 2800,
        difficulty: levelNumber // Add difficulty for potential use
    };
}

// Game class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.camera = {
            x: 0,
            y: 0
        };
        this.currentLevel = 0;
        this.levelCompleted = false;
        this.particles = new ParticleSystem();
        this.score = 0;
        this.lives = 3;
        
        // Create gradients before initializing level
        this.createGradients();
        
        // Load assets before starting the game
        this.loadAssets().then(() => {
            this.initLevel();
            this.setupControls();
            this.gameLoop();
        });
    }

    async loadAssets() {
        try {
            const [hero, enemy] = await Promise.all([
                loadSVG('hero.svg'),
                loadSVG('enemy.svg')
            ]);
            ASSETS.hero = hero;
            ASSETS.enemy = enemy;
            console.log('Assets loaded successfully');
        } catch (error) {
            console.error('Error loading assets:', error);
            // Set default colors for fallback rectangles
            COLORS.player = '#ff4444';
            COLORS.enemy = '#722';
        }
    }

    initLevel() {
        // Use predefined levels for first two levels, then generate random ones
        const level = this.currentLevel < LEVELS.length 
            ? LEVELS[this.currentLevel]
            : generateRandomLevel(this.currentLevel + 1);

        // Create platforms from level data
        this.platforms = level.platforms.map(([x, y, w, h]) => new Platform(x, y, w, h));
        
        // Create enemies from level data
        this.enemies = level.enemies.map(([x, y]) => new Enemy(x, y));
        
        // Initialize coins
        this.coins = level.coins.map(([x, y]) => new Coin(x, y));
        
        // Create player last
        this.player = new Player(50, 200);
        this.endX = level.endX;
        this.camera.x = 0;
        this.levelCompleted = false;

        // Increase difficulty for random levels
        if (this.currentLevel >= LEVELS.length) {
            this.enemies.forEach(enemy => {
                enemy.speed = 2 + (this.currentLevel - LEVELS.length) * 0.5; // Enemies get faster
                enemy.moveDistance = 100 + (this.currentLevel - LEVELS.length) * 20; // Larger patrol area
            });
        }
    }

    // Add this method to help debug
    drawDebugInfo() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`, 10, 120);
        this.ctx.fillText(`Camera: ${Math.round(this.camera.x)}`, 10, 140);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 160);
        this.ctx.fillText(`Platforms: ${this.platforms.length}`, 10, 180);
    }

    checkLevelComplete() {
        if (this.player.x >= this.endX) {
            this.levelCompleted = true;
            if (this.currentLevel < LEVELS.length - 1) {
                this.showLevelComplete();
            } else {
                this.showGameComplete();
            }
        }
    }

    showLevelComplete() {
        this.ctx.fillStyle = COLORS.ui.overlay;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create glowing effect
        const time = Date.now() * 0.001;
        const glow = Math.sin(time * 2) * 10 + 20;
        
        this.ctx.shadowColor = COLORS.ui.text;
        this.ctx.shadowBlur = glow;
        this.ctx.fillStyle = COLORS.ui.text;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level ${this.currentLevel + 1} Complete!`, this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    showGameComplete() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Congratulations!', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('You completed all levels!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.restore();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.levelCompleted && e.code === 'Space') {
                this.currentLevel++; // Always increment level
                this.initLevel();
                return;
            }

            if (e.code === 'ArrowLeft') this.player.moveLeft = true;
            if (e.code === 'ArrowRight') this.player.moveRight = true;
            if (e.code === 'Space') this.player.jump();
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft') this.player.moveLeft = false;
            if (e.code === 'ArrowRight') this.player.moveRight = false;
        });
    }

    updateCamera() {
        // Camera follows player with offset
        if (this.player.x > CAMERA_OFFSET_X) {
            this.camera.x = this.player.x - CAMERA_OFFSET_X;
        }
        
        // Prevent camera from going beyond level bounds
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.camera.x > LEVEL_WIDTH - this.canvas.width) {
            this.camera.x = LEVEL_WIDTH - this.canvas.width;
        }
    }

    update() {
        if (this.levelCompleted) return;
        
        this.player.update();
        this.enemies.forEach(enemy => enemy.update());
        this.particles.update(); // Make sure to update particles
        this.checkCollisions();
        this.updateCamera();
        this.checkLevelComplete();
    }

    checkCollisions() {
        this.player.isGrounded = false;
        
        for (let platform of this.platforms) {
            if (this.player.checkCollision(platform)) {
                this.player.resolveCollision(platform);
            }
        }

        // Check enemy collisions
        for (let enemy of this.enemies) {
            if (this.player.checkCollision(enemy)) {
                // Game over or player loses health
                this.player.x = 50;
                this.player.y = 200;
                this.camera.x = 0;
            }
        }

        // Check coin collisions
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (!coin.collected && this.player.checkCollision(coin)) {
                // Add particle effect before removing coin
                this.particles.addParticles(
                    coin.x + coin.width / 2,
                    coin.y + coin.height / 2,
                    COLORS.coin.outer,
                    15
                );
                
                // Increment score and remove coin
                this.score += 1;
                this.coins.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw sky background with gradient
        this.ctx.fillStyle = this.skyGradient;
        this.ctx.fillRect(this.camera.x, 0, LEVEL_WIDTH, this.canvas.height);
        
        // Draw decorative background elements
        this.drawClouds();
        
        // Draw level end flag with animation
        this.drawFlag();
        
        // Draw platforms with enhanced graphics
        this.platforms.forEach(platform => platform.draw(this.ctx, this.groundGradient));
        
        // Draw particles
        this.particles.draw(this.ctx);
        
        // Draw enemies with enhanced graphics
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Draw coins
        this.coins.forEach(coin => coin.draw(this.ctx));
        
        // Draw player with enhanced graphics
        this.player.draw(this.ctx);
        
        this.ctx.restore();
        
        // Draw UI elements
        this.drawUI();
        
        // Add debug info
        this.drawDebugInfo();
        
        if (this.levelCompleted) {
            this.showLevelComplete();
        }
    }

    drawClouds() {
        // Add simple cloud shapes in the background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 5; i++) {
            const x = (this.camera.x + i * 400) % LEVEL_WIDTH;
            const y = 50 + Math.sin(Date.now() * 0.001 + i) * 10;
            this.drawCloud(x, y);
        }
    }

    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 30, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y + 10, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawFlag() {
        const flagWave = Math.sin(Date.now() * 0.01) * 10;
        
        // Flag pole
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.endX, 100, 10, 250);
        
        // Flag
        this.ctx.beginPath();
        this.ctx.moveTo(this.endX + 10, 100);
        this.ctx.quadraticCurveTo(
            this.endX + 40, 125 + flagWave,
            this.endX + 50, 150
        );
        this.ctx.lineTo(this.endX + 10, 150);
        this.ctx.fillStyle = COLORS.flag;
        this.ctx.fill();
    }

    createGradients() {
        // Create sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#1e90ff');
        skyGradient.addColorStop(1, '#87ceeb');
        this.skyGradient = skyGradient;

        // Create ground gradient
        const groundGradient = this.ctx.createLinearGradient(0, 0, 0, 50);
        groundGradient.addColorStop(0, '#5c3a21');
        groundGradient.addColorStop(1, '#3d2817');
        this.groundGradient = groundGradient;
    }

    drawUI() {
        // Draw score and lives
        this.ctx.fillStyle = COLORS.ui.text;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        
        // Add text shadow
        this.ctx.shadowColor = COLORS.ui.shadow;
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        this.ctx.fillText(`Level: ${this.currentLevel + 1}`, 20, 40);
        this.ctx.fillText(`Score: ${this.score}`, 20, 70);
        
        // Draw lives
        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = COLORS.player;
            this.ctx.fillRect(20 + i * 40, 80, 30, 30);
        }
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Add high score display
        this.ctx.fillStyle = COLORS.ui.text;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High Level: ${Math.max(this.currentLevel + 1, localStorage.getItem('highLevel') || 1)}`, this.canvas.width - 20, 40);
        
        // Save high level
        if (this.currentLevel + 1 > (localStorage.getItem('highLevel') || 1)) {
            localStorage.setItem('highLevel', this.currentLevel + 1);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.velocityX = 0;
        this.velocityY = 0;
        this.moveLeft = false;
        this.moveRight = false;
        this.isGrounded = false;
        this.direction = 1; // Add direction property (1 for right, -1 for left)
        this.animationState = ANIMATION_STATES.IDLE;
        this.lastJumpTime = 0;
    }

    update() {
        // Update animation state
        if (!this.isGrounded) {
            this.animationState = ANIMATION_STATES.JUMPING;
        } else if (this.moveLeft || this.moveRight) {
            this.animationState = ANIMATION_STATES.WALKING;
        } else {
            this.animationState = ANIMATION_STATES.IDLE;
        }

        // Horizontal movement
        if (this.moveLeft) {
            this.velocityX = -PLAYER_SPEED;
            this.direction = -1;
        }
        else if (this.moveRight) {
            this.velocityX = PLAYER_SPEED;
            this.direction = 1;
        }
        else this.velocityX = 0;

        // Apply gravity
        this.velocityY += GRAVITY;

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Prevent player from going beyond level bounds
        if (this.x < 0) this.x = 0;
        if (this.x > LEVEL_WIDTH - this.width) {
            this.x = LEVEL_WIDTH - this.width;
        }
    }

    jump() {
        if (this.isGrounded) {
            this.velocityY = JUMP_FORCE;
            this.isGrounded = false;
            this.lastJumpTime = Date.now();
            
            // Squash and stretch animation
            if (ASSETS.hero) {
                ASSETS.hero.style.transform = 'scaleY(0.8) scaleX(1.2)';
                setTimeout(() => {
                    ASSETS.hero.style.transform = 'scale(1)';
                }, 100);
            }
        }
    }

    checkCollision(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }

    resolveCollision(platform) {
        const fromTop = this.y + this.height - platform.y;
        const fromBottom = platform.y + platform.height - this.y;
        const fromLeft = this.x + this.width - platform.x;
        const fromRight = platform.x + platform.width - this.x;

        const minDistance = Math.min(fromTop, fromBottom, fromLeft, fromRight);

        if (minDistance === fromTop && this.velocityY >= 0) {
            this.y = platform.y - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
        } else if (minDistance === fromBottom && this.velocityY <= 0) {
            this.y = platform.y + platform.height;
            this.velocityY = 0;
        } else if (minDistance === fromLeft && this.velocityX >= 0) {
            this.x = platform.x - this.width;
        } else if (minDistance === fromRight && this.velocityX <= 0) {
            this.x = platform.x + platform.width;
        }
    }

    draw(ctx) {
        if (ASSETS.hero) {
            ctx.save();
            
            // Draw shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(this.x - 2, this.y + 2, this.width, this.height);
            
            // Apply animations based on state
            const bounceOffset = this.animationState === ANIMATION_STATES.WALKING ? 
                Math.sin(Date.now() * 0.01) * 2 : 0;
            
            // Flip hero based on direction
            if (this.direction < 0) {
                ctx.scale(-1, 1);
                ctx.translate(-this.x * 2 - this.width, 0);
            }
            
            // Draw hero with animation offset
            ctx.drawImage(
                ASSETS.hero, 
                this.x, 
                this.y + bounceOffset, 
                this.width, 
                this.height
            );
            
            if (DEBUG) {
                ctx.strokeStyle = 'yellow';
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
            ctx.restore();
        } else {
            // Fallback to rectangle
            ctx.fillStyle = COLORS.player;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Platform class
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx, gradient) {
        ctx.fillStyle = gradient || COLORS.platform;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(this.x, this.y, this.width, 5);
    }
}

// Enemy class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.direction = 1;
        this.moveDistance = 100;
        this.startX = x;
        this.bounceOffset = 0;
    }

    update() {
        this.x += this.speed * this.direction;
        
        // Change direction when moved enough distance
        if (Math.abs(this.x - this.startX) > this.moveDistance) {
            this.direction *= -1;
        }

        // Add bouncing animation
        this.bounceOffset = Math.sin(Date.now() * 0.005) * 2;
    }

    draw(ctx) {
        if (ASSETS.enemy) {
            ctx.save();
            
            // Draw shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(this.x - 2, this.y + 2, this.width, this.height);
            
            // Flip enemy based on direction
            if (this.direction < 0) {
                ctx.scale(-1, 1);
                ctx.translate(-this.x * 2 - this.width, 0);
            }
            
            // Draw enemy with bounce animation
            ctx.drawImage(
                ASSETS.enemy, 
                this.x, 
                this.y + this.bounceOffset, 
                this.width, 
                this.height
            );
            
            if (DEBUG) {
                ctx.strokeStyle = 'red';
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
            ctx.restore();
        } else {
            // Fallback to rectangle
            ctx.fillStyle = COLORS.enemy;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Add Coin class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.rotation = 0;
        this.collected = false;
        this.baseY = y;
        this.timeOffset = Math.random() * Math.PI * 2;
    }

    collect() {
        this.collected = true;
    }

    update() {
        if (this.collected) {
            return true; // Remove immediately when collected
        }

        // Coin rotation animation
        const time = Date.now() * 0.001 + this.timeOffset;
        
        // Continuous rotation
        this.rotation = time * 3; // Faster rotation
        
        // Floating animation
        this.y = this.baseY + Math.sin(time * 2) * 3;

        return false; // Keep the coin
    }

    draw(ctx) {
        if (this.collected) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Scale based on rotation to create 3D effect
        const scaleX = Math.abs(Math.cos(this.rotation)) * 0.8 + 0.2;
        ctx.scale(scaleX, 1);

        const radius = this.width / 2;
        
        // Main coin body
        const coinGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        coinGradient.addColorStop(0, '#FFD700');
        coinGradient.addColorStop(1, '#FFA500');
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = coinGradient;
        ctx.fill();

        // Add details when coin is more visible
        if (scaleX > 0.5) {
            // Inner circle
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = '#FFA500';
            ctx.fill();

            // Star shape
            ctx.beginPath();
            const starPoints = 5;
            const innerRadius = radius * 0.3;
            const outerRadius = radius * 0.5;
            
            for (let i = 0; i < starPoints * 2; i++) {
                const r = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / starPoints;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = '#FFD700';
            ctx.fill();
        }

        // Edge highlight
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();

        // Sparkle effect
        const sparkleOpacity = (Math.sin(Date.now() * 0.003 + this.timeOffset) * 0.5 + 0.5) * 0.7;
        if (sparkleOpacity > 0.1) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkleOpacity})`;
            
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI / 2) + Date.now() * 0.003;
                const x = Math.cos(angle) * (radius * 0.8);
                const y = Math.sin(angle) * (radius * 0.8);
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
            ctx.restore();
        }
    }
}

// Start the game
new Game(); 