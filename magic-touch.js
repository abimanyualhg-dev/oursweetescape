// ======================
// WEBCAM
// ======================

const video = document.getElementById("webcam");

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: 640,
        height: 480
      },
      audio: false
    });

    video.srcObject = stream;
  } catch (error) {
    console.error("Failed to access camera:", error);
  }
}

startCamera();


// ======================
// STARS
// ======================

const canvas = document.getElementById("starCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);


// ======================
// STAR CLASS
// ======================

class Star {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.radius = Math.random() * 2 + 0.5;

    this.opacity = Math.random();
    this.twinkleSpeed =
      (Math.random() * 0.02 + 0.005) *
      (Math.random() > 0.5 ? 1 : -1);

    this.vx = (Math.random() - 0.5) * 0.08;
    this.vy = (Math.random() - 0.5) * 0.08;
  }

  update() {
    // drifting
    this.x += this.vx;
    this.y += this.vy;

    // pantul kalau keluar layar
    if (this.x < 0 || this.x > canvas.width) {
      this.vx *= -1;
    }

    if (this.y < 0 || this.y > canvas.height) {
      this.vy *= -1;
    }

    // twinkling
    this.opacity += this.twinkleSpeed;

    if (this.opacity <= 0.15) {
      this.opacity = 0.15;
      this.twinkleSpeed *= -1;
    }

    if (this.opacity >= 1) {
      this.opacity = 1;
      this.twinkleSpeed *= -1;
    }
  }

  draw() {
    ctx.save();

    ctx.globalAlpha = this.opacity;

    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      this.radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffffff";

    ctx.restore();
  }
}


// ======================
// CREATE STARS
// ======================

const STAR_COUNT = 400;
const stars = [];

for (let i = 0; i < STAR_COUNT; i++) {
  stars.push(new Star());
}


// ======================
// ANIMATION
// ======================

function animate() {

  // trailing effect tipis
  ctx.fillStyle = "rgba(1, 2, 4, 0.25)";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  stars.forEach(star => {
    star.update();
    star.draw();
  });

  requestAnimationFrame(animate);
}

animate();
