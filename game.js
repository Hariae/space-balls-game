
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const centerX = W / 2, centerY = H / 2;
const RADIUS = Math.min(W, H) * 0.38;
const OPENING_ANGLE = 2 * Math.PI / 20; // 1/20 of the circle
const OPENING_START = -Math.PI / 6; // Rotate opening toward top by default
const GRAVITY = 0.07;
let balls = [], animId = null, running = true;
const BALL_RADIUS = 18;
const COLORS = ['#00fff5', '#e5ff00', '#ff00d4', '#00ff9d', '#ff3366', '#00aaff', '#ffe100'];
let tingSound = null;

function randomColor() {
    return COLORS[ Math.floor(Math.random() * COLORS.length) ];
}

function playTing() {
    if (tingSound) {
        tingSound.currentTime = 0;
        tingSound.play();
    }
}

function randInCircle() {
    let a = Math.random() * 2 * Math.PI;
    let rr = Math.random() * (RADIUS - BALL_RADIUS * 2);
    return {
        x: centerX + Math.cos(a) * (rr + BALL_RADIUS * 2),
        y: centerY + Math.sin(a) * (rr + BALL_RADIUS * 2)
    };
}

function Ball(x, y, vx, vy, col) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.radius = BALL_RADIUS;
    this.color = col || randomColor();
    this.trail = [];
}
Ball.prototype.update = function(){
    // Add to trail
    this.trail.push({x: this.x, y: this.y});
    if(this.trail.length > 8) this.trail.shift();
    // Move
    this.x += this.vx;
    this.y += this.vy;
    // Gravity
    this.vy += GRAVITY;
    // Wall (circle) collision
    let dx = this.x - centerX, dy = this.y - centerY;
    let dist = Math.sqrt(dx * dx + dy * dy);
    // Check exit through opening
    if (dist > (RADIUS - this.radius)) {
        let ang = Math.atan2(dy, dx);
        let start = OPENING_START, end = OPENING_START + OPENING_ANGLE;
        let inOpen = (ang > start && ang < end);
        if (inOpen && dist > (RADIUS - this.radius + 2)) {
            // Ball leaves: return true (to spawn 2 balls)
            return true;
        } else {
            // Reflect velocity
            let nx = dx/dist, ny = dy/dist;
            let vdotn = this.vx*nx + this.vy*ny;
            this.vx -= 2 * vdotn * nx;
            this.vy -= 2 * vdotn * ny;
            this.x = centerX + nx * (RADIUS - this.radius - 2);
            this.y = centerY + ny * (RADIUS - this.radius - 2);
            playTing();
        }
    }
    return false;
}
Ball.prototype.draw = function(){
    // Trail glow
    for (let i = 0; i < this.trail.length; ++i) {
        let p = this.trail[i];
        ctx.save();
        ctx.globalAlpha = 0.1 + 0.07 * i;
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.radius + 4 + 2*i, 0, 2*Math.PI);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10 + i*2;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
    // Ball glow
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 30;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
    // Ball outline
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff2';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius+1.5, 0, 2*Math.PI);
    ctx.stroke();
    ctx.restore();
}

function spawnBall() {
    let p = randInCircle();
    let v = Math.random() * 4 + 2;
    let ang = Math.random() * 2 * Math.PI;
    let vx = v * Math.cos(ang), vy = v * Math.sin(ang);
    balls.push( new Ball(p.x, p.y, vx, vy) );
}

function restartGame() {
    balls = [];
    let ang = Math.random()*2*Math.PI;
    let v = 6, vx = v * Math.cos(ang), vy = v * Math.sin(ang);
    balls.push( new Ball(centerX, centerY, vx, vy, '#00fff5') );
    running = true;
    if (!animId) loop();
}

function loop() {
    ctx.clearRect(0,0,W,H);
    // Space bkg stars
    for(let s=0; s<28; ++s) {
        ctx.save();
        ctx.globalAlpha = 0.05 + Math.random()*0.08;
        ctx.beginPath();
        ctx.arc(Math.random()*W, Math.random()*H, 1.5 + Math.random()*1.7, 0, 2*Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    }
    // Draw neon circle with opening
    ctx.save();
    ctx.strokeStyle = '#23fff5';
    ctx.shadowBlur = 42;
    ctx.shadowColor = '#23fff5';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(centerX, centerY, RADIUS, OPENING_START + OPENING_ANGLE, OPENING_START + 2*Math.PI);
    ctx.stroke();
    ctx.restore();
    // Ball logic
    let toSpawn = 0;
    for(let i=balls.length-1; i>=0; --i) {
        let gone = balls[i].update();
        balls[i].draw();
        if (gone) {
            balls.splice(i,1);
            toSpawn += 2;
        }
    }
    for(let j=0; j<toSpawn && balls.length<96; ++j) spawnBall();
    animId = running ? requestAnimationFrame(loop) : null;
}

function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    document.getElementById('copiedMsg').style.display = 'inline';
    setTimeout(()=>document.getElementById('copiedMsg').style.display='none', 1400);
}

window.restartGame = restartGame;
window.copyShareLink = copyShareLink;

// Sound asset (tiny glass ting, base64-encoded)
function setupSound() {
    tingSound = new Audio('assets/ting.mp3');
    tingSound.volume = 0.23;
}
setupSound();

// Responsive size
window.addEventListener('resize',()=>{
    let minW = Math.min(window.innerWidth, window.innerHeight) * 0.96;
    canvas.width = canvas.height = minW > 800 ? 800 : minW;
});
window.dispatchEvent(new Event('resize'));

// Start
restartGame();
