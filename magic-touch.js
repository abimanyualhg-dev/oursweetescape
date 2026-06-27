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
// CANVAS STAR FIELD
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
// STAR CLASS (IMPROVED IDLE SYSTEM)
// ======================

class Star {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.baseX = this.x;
    this.baseY = this.y;

    this.radius = Math.random() * 2 + 0.5;

    this.opacity = Math.random();
    this.twinkleSpeed = (Math.random() * 0.003 + 0.001);

    this.vx = 0;
    this.vy = 0;

    this.seed = Math.random() * 1000;

    // idle drift strength
    this.drift = Math.random() * 0.6 + 0.2;
  }

  update(time) {
    const t = time * 0.001;

    // ======================
    // IDLE DRIFT (natural float)
    // ======================
    const noiseX = Math.sin(t + this.seed) * this.drift * 0.15;
    const noiseY = Math.cos(t + this.seed * 1.3) * this.drift * 0.15;

    this.vx += noiseX * 0.01;
    this.vy += noiseY * 0.01;

    // damping (biar smooth, gak liar)
    this.vx *= 0.96;
    this.vy *= 0.96;

    this.x += this.vx;
    this.y += this.vy;

    // soft boundary bounce
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

    // ======================
    // TWINKLE (smooth sine-based)
    // ======================
    this.opacity =
      0.4 +
      0.6 * Math.sin(t * 1.2 + this.seed);
  }

  draw(ctx, time) {
    ctx.save();

    ctx.globalAlpha = Math.max(0.2, this.opacity);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    ctx.fillStyle = "#ffffff";

    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255,255,255,0.6)";

    ctx.fill();
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
// ANIMATION LOOP
// ======================

function animate(time) {

  // ======================
  // SMOOTH SKY BACKGROUND
  // ======================
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);

  sky.addColorStop(0, "#071021");
  sky.addColorStop(0.5, "#030712");
  sky.addColorStop(1, "#000000");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ======================
  // SOFT GLOW FIELD
  // ======================
  const glow = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height * 0.2,
    0,
    canvas.width / 2,
    canvas.height * 0.2,
    canvas.width * 0.5
  );

  glow.addColorStop(0, "rgba(100,140,255,0.08)");
  glow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ======================
  // TRAIL LAYER (magic feel)
  // ======================
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ======================
  // UPDATE + DRAW STARS
  // ======================
  for (let star of stars) {
    star.update(time);
    star.draw(ctx, time);
  }

  requestAnimationFrame(animate);
}

animate();


// ======================
// MEDIAPIPE HANDS
// (tetap, belum dihubungkan ke physics)
// ======================

const handCanvas = document.getElementById("handCanvas");
const handCtx = handCanvas.getContext("2d");

function resizeHandCanvas() {
  handCanvas.width = video.clientWidth;
  handCanvas.height = video.clientHeight;
}

video.addEventListener("loadedmetadata", resizeHandCanvas);
window.addEventListener("resize", resizeHandCanvas);

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

let currentGesture = "NONE";

hands.onResults((results) => {

  handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

  let gesture = "NONE";

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {

      drawConnectors(handCtx, landmarks, HAND_CONNECTIONS, {
        color: "rgba(255,182,217,0.55)",
        lineWidth: 1
      });

      for (const point of landmarks) {
        handCtx.beginPath();
        handCtx.arc(
          point.x * handCanvas.width,
          point.y * handCanvas.height,
          2,
          0,
          Math.PI * 2
        );

        handCtx.fillStyle = "#ffb6d9";
        handCtx.fill();
      }

      // ======================
      // SIMPLE GESTURE LOGIC
      // ======================

      const index = landmarks[8].y < landmarks[6].y;
      const middle = landmarks[12].y < landmarks[10].y;
      const ring = landmarks[16].y < landmarks[14].y;
      const pinky = landmarks[20].y < landmarks[18].y;

      if (index && middle && ring && pinky) gesture = "OPEN_PALM";
      else if (!index && !middle && !ring && !pinky) gesture = "FIST";
      else if (index && !middle && !ring && !pinky) gesture = "POINT_UP";
      else if (index && middle && !ring && !pinky) gesture = "PEACE";
    }
  }

  if (gesture !== currentGesture) {
    currentGesture = gesture;
    console.log("Gesture:", currentGesture);
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
