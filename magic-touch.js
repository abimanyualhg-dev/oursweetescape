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

class Star {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.vx = (Math.random() - 0.5) * 0.2;
    this.vy = (Math.random() - 0.5) * 0.2;

    this.radius = Math.random() * 1.6 + 0.4;
    this.seed = Math.random() * 1000;
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

    // wrap
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;
  }

  draw(t) {
    const glow = 0.5 + 0.5 * Math.sin(t * 0.002 + this.seed);

    ctx.save();
    ctx.globalAlpha = glow;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ffffff";

    ctx.fill();
    ctx.restore();
  }
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

animate();


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
