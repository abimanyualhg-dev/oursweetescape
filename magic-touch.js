// ======================
// CAMERA
// ======================

const video = document.getElementById("webcam");

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: 640, height: 480 },
    audio: false
  });

  video.srcObject = stream;
}

startCamera();


// ======================
// STAR CANVAS
// ======================

const canvas = document.getElementById("starCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);


// ======================
// STAR SYSTEM
// ======================

function drawStar(ctx, x, y, outerRadius, innerRadius, points, rotation) {
  ctx.beginPath();

  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i + rotation;
    const r = (i % 2 === 0) ? outerRadius : innerRadius;

    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }

  ctx.closePath();
}

class Star {
  constructor() {
    this.reset();
  }

  reset() {
  this.x = Math.random() * canvas.width;
  this.y = Math.random() * canvas.height;

  this.depth = 0.5 + Math.random();

  this.vx = (Math.random() - 0.5) * 0.15 * this.depth;
  this.vy = (Math.random() - 0.5) * 0.15 * this.depth;

  this.radius = 1 + Math.random() * 4;

  this.opacity = 0.35 + Math.random() * 0.65;

  this.seed = Math.random() * 1000;

  this.rotation = Math.random() * Math.PI * 2;
  this.rotationSpeed = (Math.random() - 0.5) * 0.015;

  this.points = Math.random() > 0.5 ? 4 : 5;

  this.floatOffset = Math.random() * 1000;
}

  update(t) {
    const time = t * 0.001;

    // slow organic drift
    this.vx += Math.sin(time + this.seed) * 0.002;
    this.vy += Math.cos(time + this.seed) * 0.002;

    this.vx *= 0.97;
    this.vy *= 0.97;

    this.x += this.vx;
    this.y += this.vy;

    this.floatOffset += 0.03;

this.x += Math.sin(this.floatOffset) * 0.08;
this.y += Math.cos(this.floatOffset) * 0.08;

this.rotation += this.rotationSpeed;

    // wrap
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;
  }

  draw(t) {

  const twinkle =
    0.6 +
    0.4 * Math.sin(t * 0.003 + this.seed);

  const size =
    this.radius * this.depth;

  ctx.save();

  ctx.translate(this.x, this.y);
  ctx.rotate(this.rotation);

  ctx.globalAlpha =
    this.opacity * twinkle;

  const gradient = ctx.createRadialGradient(
    0,
    0,
    0,
    0,
    0,
    size * 4
  );

  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.25, "#d8ffff");
  gradient.addColorStop(0.6, "#82f7ff");
  gradient.addColorStop(1, "rgba(130,247,255,0)");

  ctx.fillStyle = gradient;

  ctx.shadowBlur = 20 * this.depth;
  ctx.shadowColor = "#7df9ff";

  drawStar(
    ctx,
    0,
    0,
    size,
    size * 0.45,
    this.points,
    0
  );

  ctx.fill();

  ctx.restore();
}

// create stars
const stars = [];
for (let i = 0; i < 400; i++) {
  stars.push(new Star());
}


// ======================
// LOOP
// ======================

function animate(t) {

  // background
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#071021");
  sky.addColorStop(1, "#000000");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // IMPORTANT: safe fade (NOT destroy visibility)
  ctx.fillStyle = "rgba(0,0,0,0.03)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let star of stars) {
    star.update(t);
    star.draw(t);
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);


// ======================
// MEDIAPIPE HANDS
// ======================

const handCanvas = document.getElementById("handCanvas");
const handCtx = handCanvas.getContext("2d");

function resizeHand() {
  handCanvas.width = video.clientWidth;
  handCanvas.height = video.clientHeight;
}

video.addEventListener("loadedmetadata", resizeHand);
window.addEventListener("resize", resizeHand);

const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults((results) => {
  handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

  if (!results.multiHandLandmarks) return;

  for (const lm of results.multiHandLandmarks) {
    drawConnectors(handCtx, lm, HAND_CONNECTIONS, {
      color: "rgba(255,182,217,0.6)",
      lineWidth: 1
    });

    for (const p of lm) {
      handCtx.beginPath();
      handCtx.arc(
        p.x * handCanvas.width,
        p.y * handCanvas.height,
        2,
        0,
        Math.PI * 2
      );

      handCtx.fillStyle = "#ffb6d9";
      handCtx.fill();
    }
  }
});

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

camera.start();
