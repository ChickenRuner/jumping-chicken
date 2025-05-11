// Настройки звука и музыка
const jumpSound = new Audio('assets/sounds/jump.wav');
const hitSound = new Audio('assets/sounds/hit.wav');
const coinSound = new Audio('assets/sounds/coin.wav');
const bgMusic = new Audio('assets/sounds/background_music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;

let soundEnabled = true;
let musicEnabled = true;

const toggleSoundBtn = document.getElementById('toggleSoundBtn');
const toggleMusicBtn = document.getElementById('toggleMusicBtn');
const startGameBtn = document.getElementById('startGameBtn');

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

// Настройка canvas и масштабирования
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let scale = canvas.width / 800;

// Изображения
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

// Объекты
const chicken = {
    x: 50 * scale,
    y: 250 * scale,
    width: 80 * scale,
    height: 80 * scale,
    speedY: 0,
    gravity: 0.5 * scale,
    jumpPower: -13 * scale,
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
let gameSpeed = 4 * scale;

let isGameStarted = false;
let isGameOver = false;
let hasMagnet = false;
let magnetTimer = 0;

function spawnObstacle() {
    if (!isGameStarted || isGameOver) return;

    const img = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
    let obstacleWidth = 60 * scale, obstacleHeight = 60 * scale, obstacleY = canvas.height - 120 * scale;

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

    const isMagnet = !hasMagnet && Math.random() < 0.1;
    const xOffset = canvas.width + Math.random() * 400 * scale;
    const y = (Math.random() * 200 + 100) * scale;
    const count = isMagnet ? 1 : Math.floor(Math.random() * 3 + 2);

    for (let i = 0; i < count; i++) {
        bonuses.push({
            x: xOffset + i * 35 * scale,
            y: y - i * 5 * scale,
            size: 30 * scale,
            speed: gameSpeed,
            image: isMagnet ? magnetImage : bonusImage,
            isMagnet: isMagnet && i === 0
        });
    }
}

setInterval(spawnObstacle, 2000);
setInterval(spawnBonus, 2500);

function gameLoop() {
    scale = canvas.width / 800;
    const groundY = canvas.height - 150 * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    backgroundX = (backgroundX - gameSpeed) % canvas.width;
    ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);

    if (!isGameStarted) {
        requestAnimationFrame(gameLoop);
        return;
    }

    if (hasMagnet) {
        magnetTimer--;
        if (magnetTimer <= 0) hasMagnet = false;

        bonuses.forEach(b => {
            if (!b.isMagnet) {
                const dx = chicken.x - b.x;
                const dy = chicken.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200 * scale) {
                    b.x += dx * 0.05;
                    b.y += dy * 0.05;
                }
            }
        });
    }

    if (isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = `${36 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Игра окончена!', canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Очки: ${score}`, canvas.width / 2, canvas.height / 2 + 40 * scale);
        ctx.fillText('Нажмите, чтобы начать заново', canvas.width / 2, canvas.height / 2 + 80 * scale);
        requestAnimationFrame(gameLoop);
        return;
    }

    chicken.frameIndex += chicken.frameSpeed;
    if (chicken.frameIndex >= chickenFrames.length) chicken.frameIndex = 0;

    const currentFrame = chickenFrames[Math.floor(chicken.frameIndex)];
    ctx.drawImage(currentFrame, chicken.x, chicken.y, chicken.width, chicken.height);

    chicken.y += chicken.speedY;
    if (!chicken.isDead) chicken.speedY += chicken.gravity;

    if (chicken.y >= groundY) {
        chicken.y = groundY;
        chicken.speedY = 0;
        chicken.onGround = true;
        canDoubleJump = true;
    }

    obstacles.forEach((o, i) => {
        ctx.drawImage(o.image, o.x, o.y, o.width, o.height);
        if (!chicken.isDead) o.x -= o.speed;

        if (!chicken.isDead &&
            chicken.x < o.x + o.width &&
            chicken.x + chicken.width > o.x &&
            chicken.y < o.y + o.height &&
            chicken.y + chicken.height > o.y) {
            chicken.isDead = true;
            safePlay(hitSound);
            chicken.speedY = -7 * scale;
            setTimeout(() => {
                isGameOver = true;
                bgMusic.pause();
                bgMusic.currentTime = 0;
            }, 800);
        }

        if (o.x + o.width < 0) {
            obstacles.splice(i, 1);
            if (!chicken.isDead) {
                score++;
                if (score % 10 === 0) gameSpeed += 0.3 * scale;
            }
        }
    });

    bonuses.forEach((b, i) => {
        b.x -= b.speed;
        ctx.drawImage(b.image, b.x, b.y, b.size, b.size);

        if (chicken.x < b.x + b.size && chicken.x + chicken.width > b.x &&
            chicken.y < b.y + b.size && chicken.y + chicken.height > b.y) {
            if (b.isMagnet) {
                hasMagnet = true;
                magnetTimer = 600;
            } else {
                score += 5;
                safePlay(coinSound);
            }
            bonuses.splice(i, 1);
        } else if (b.x + b.size < 0) {
            bonuses.splice(i, 1);
        }
    });

    ctx.fillStyle = 'black';
    ctx.font = `${24 * scale}px Arial`;
    ctx.fillText(`Очки: ${score}`, canvas.width - 160 * scale, 40 * scale);

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
