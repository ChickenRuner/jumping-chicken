// Звуки
const jumpSound = new Audio('assets/sounds/jump.wav');
const hitSound = new Audio('assets/sounds/hit.wav');
const coinSound = new Audio('assets/sounds/coin.wav');
const bgMusic = new Audio('assets/sounds/background_music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;

// Звук/музыка управление
const toggleSoundBtn = document.getElementById('toggleSoundBtn');
const toggleMusicBtn = document.getElementById('toggleMusicBtn');
const startGameBtn = document.getElementById('startGameBtn');

let soundEnabled = true;
let musicEnabled = true;

toggleSoundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    toggleSoundBtn.textContent = soundEnabled ? '🔊 Звук: Вкл' : '🔇 Звук: Выкл';
});

toggleMusicBtn.addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    toggleMusicBtn.textContent = musicEnabled ? '🎵 Музыка: Вкл' : '🎵 Музыка: Выкл';
});

startGameBtn.addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    isGameStarted = true;
    if (musicEnabled) bgMusic.play();
    gameLoop();
});

function safePlay(sound) {
    if (soundEnabled) {
        sound.currentTime = 0;
        sound.play();
    }
}

// Картинки
const backgroundImage = new Image();
backgroundImage.src = 'assets/background.png';

const chickenFrames = [];
for (let i = 1; i <= 18; i++) {
    const img = new Image();
    img.src = `assets/chicken_frame_${i}.png`;
    chickenFrames.push(img);
}

const obstacleImages = [];
for (let i = 1; i <= 5; i++) {
    const img = new Image();
    img.src = `assets/obstacles/obstacle${i}.png`;
    obstacleImages.push(img);
}

const bonusImage = new Image();
bonusImage.src = 'assets/bonus_coin.png';

const magnetImage = new Image();
magnetImage.src = 'assets/bonus_magnet.png';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Объекты
const chicken = {
    x: 50,
    y: 250,
    width: 80,
    height: 80,
    speedY: 0,
    gravity: 0.5,
    jumpPower: -13,
    onGround: true,
    frameIndex: 0,
    frameSpeed: 0.7,
    isDead: false
};

const obstacles = [];
const bonuses = [];
let canDoubleJump = true;
let score = 0;
let backgroundX = 0;
let gameSpeed = 4;

let isGameStarted = false;
let isGameOver = false;

let hasMagnet = false;
let magnetTimer = 0;

function spawnObstacle() {
    if (!isGameStarted || isGameOver) return;

    const img = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
    let obstacleWidth = 60, obstacleHeight = 60, obstacleY = 280;

    if (img.src.includes('egg')) {
        obstacleWidth = 40; obstacleHeight = 40; obstacleY = 310;
    } else if (img.src.includes('cow')) {
        obstacleWidth = 80; obstacleHeight = 80; obstacleY = 270;
    } else if (img.src.includes('chair')) {
        obstacleWidth = 50; obstacleHeight = 50; obstacleY = 285;
    } else if (img.src.includes('bucket')) {
        obstacleWidth = 60; obstacleHeight = 60; obstacleY = 280;
    } else if (img.src.includes('table')) {
        obstacleWidth = 70; obstacleHeight = 70; obstacleY = 270;
    }

    obstacles.push({
        x: canvas.width,
        y: obstacleY,
        width: obstacleWidth,
        height: obstacleHeight,
        speed: gameSpeed,
        image: img
    });
}

function spawnBonus() {
    if (!isGameStarted || isGameOver) return;

    const canSpawnMagnet = !hasMagnet && Math.random() < 0.1;
    const isMagnet = canSpawnMagnet;

    const xOffset = canvas.width + Math.random() * 400;
    const yPatterns = [180, 140, 220, 160, 200];
    const baseY = yPatterns[Math.floor(Math.random() * yPatterns.length)];

    const isCoinGroup = !isMagnet && Math.random() < 0.6;
    const count = isCoinGroup ? 2 + Math.floor(Math.random() * 4) : 1;

    for (let i = 0; i < count; i++) {
        bonuses.push({
            x: xOffset + i * 35,
            y: baseY - (isCoinGroup ? i * 5 : 0),
            size: 30,
            speed: gameSpeed,
            image: isMagnet ? magnetImage : bonusImage,
            isMagnet: isMagnet && i === 0
        });
    }
}

setInterval(spawnObstacle, 2000);
setInterval(spawnBonus, 2000);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    backgroundX = (backgroundX - gameSpeed) % canvas.width;
    ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);

    if (!isGameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Нажмите, чтобы начать', canvas.width / 2, canvas.height / 2);
        requestAnimationFrame(gameLoop);
        return;
    }

    if (hasMagnet) {
        magnetTimer--;
        if (magnetTimer <= 0) hasMagnet = false;

        bonuses.forEach(bonus => {
            if (!bonus.isMagnet) {
                const dx = chicken.x - bonus.x;
                const dy = chicken.y - bonus.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200) {
                    bonus.x += dx * 0.05;
                    bonus.y += dy * 0.05;
                }
            }
        });
    }

    if (isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Игра окончена!', canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText('Очки: ' + score, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Нажмите, чтобы сыграть ещё раз', canvas.width / 2, canvas.height / 2 + 60);
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!chicken.isDead) {
        chicken.frameIndex += chicken.frameSpeed;
        if (chicken.frameIndex >= chickenFrames.length) chicken.frameIndex = 0;
    }

    const currentFrame = chickenFrames[Math.floor(chicken.frameIndex)];
    ctx.drawImage(currentFrame, Math.round(chicken.x), Math.round(chicken.y), chicken.width, chicken.height);

    chicken.y += chicken.speedY;
    if (!chicken.isDead) chicken.speedY += chicken.gravity;

    if (chicken.y >= 250) {
        chicken.y = 250;
        chicken.speedY = 0;
        chicken.onGround = true;
        canDoubleJump = true;
    }

    obstacles.forEach((obstacle, index) => {
        ctx.drawImage(obstacle.image, Math.round(obstacle.x), Math.round(obstacle.y), obstacle.width, obstacle.height);
        if (!chicken.isDead) obstacle.x -= obstacle.speed;

        if (!chicken.isDead &&
            chicken.x < obstacle.x + obstacle.width &&
            chicken.x + chicken.width > obstacle.x &&
            chicken.y < obstacle.y + obstacle.height &&
            chicken.y + chicken.height > obstacle.y) {
            chicken.isDead = true;
            safePlay(hitSound);
            chicken.speedY = -7;
            setTimeout(() => {
                isGameOver = true;
                bgMusic.pause();
                bgMusic.currentTime = 0;
            }, 800);
        }

        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            if (!chicken.isDead) {
                score++;
                if (score % 10 === 0) gameSpeed += 0.3;
            }
        }
    });

    bonuses.forEach((bonus, index) => {
        bonus.x -= bonus.speed;
        ctx.drawImage(bonus.image, Math.round(bonus.x), Math.round(bonus.y), bonus.size, bonus.size);

        if (
            chicken.x < bonus.x + bonus.size &&
            chicken.x + chicken.width > bonus.x &&
            chicken.y < bonus.y + bonus.size &&
            chicken.y + chicken.height > bonus.y
        ) {
            if (bonus.isMagnet) {
                hasMagnet = true;
                magnetTimer = 600;
            } else {
                score += 5;
                safePlay(coinSound);
            }
            bonuses.splice(index, 1);
            return;
        }

        if (bonus.x + bonus.size < 0) {
            bonuses.splice(index, 1);
        }
    });

    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('Очки: ' + score, 650, 50);

    requestAnimationFrame(gameLoop);
}

// Управление с клавиатуры
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        handleJump();
    }
});

// Управление кликом по canvas (для мыши)
canvas.addEventListener('click', () => {
    if (!isGameStarted) return;
    if (isGameOver) {
        document.location.reload();
    } else {
        handleJump();
    }
});

// Управление через тач (мобильные устройства)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!isGameStarted) return;
    if (isGameOver) {
        document.location.reload();
    } else {
        handleJump();
    }
}, { passive: false });

// Функция прыжка и двойного прыжка
function handleJump() {
    if (chicken.isDead || !isGameStarted || isGameOver) return;

    if (chicken.onGround) {
        chicken.speedY = chicken.jumpPower;
        chicken.onGround = false;
        canDoubleJump = true;
        safePlay(jumpSound);
    } else if (canDoubleJump) {
        chicken.speedY = chicken.jumpPower;
        canDoubleJump = false;
        safePlay(jumpSound);
    }
}

gameLoop();
