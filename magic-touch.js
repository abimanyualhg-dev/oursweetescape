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

// ======================
// PARTICLE MODES
// ======================

let particleMode = "idle";

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

    this.homeX = Math.random() * canvas.width;
    this.homeY = Math.random() * canvas.height;

    this.x = this.homeX;
    this.y = this.homeY;

    this.targetX = this.homeX;
    this.targetY = this.homeY;

    this.radius = 1 + Math.random() * 4;

    this.depth = 0.5 + Math.random();

    this.opacity = 0.35 + Math.random() * 0.65;

    this.seed = Math.random() * 9999;

    this.rotation = Math.random() * Math.PI * 2;

    this.rotationSpeed =
      (Math.random() - 0.5) * 0.015;

    this.points =
      Math.random() > 0.5 ? 4 : 5;

    this.floatOffset =
      Math.random() * 1000;
  }

  setTarget(x, y) {

    this.targetX = x;
    this.targetY = y;

  }

  update(t) {

    this.floatOffset += 0.03;

    const floatX =
      Math.sin(this.floatOffset) * 0.4;

    const floatY =
      Math.cos(this.floatOffset) * 0.4;

    this.x +=
      ((this.targetX + floatX) - this.x) * 0.08;

    this.y +=
      ((this.targetY + floatY) - this.y) * 0.08;

    this.rotation += this.rotationSpeed;

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

    const gradient =
      ctx.createRadialGradient(
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

}
// create stars
const stars = [];
function setIdleMode() {

  for (const s of stars) {

    s.setTarget(
      s.homeX,
      s.homeY
    );

  }

}

function setClusterMode() {

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  for (const s of stars) {

    const angle =
      Math.random() * Math.PI * 2;

    const radius =
      Math.random() * 35;

    s.setTarget(

      cx + Math.cos(angle) * radius,

      cy + Math.sin(angle) * radius

    );

  }

}
for (let i = 0; i < 400; i++) {
  stars.push(new Star());
}

setIdleMode();

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
  console.log(results.multiHandLandmarks);
  handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

  if (!results.multiHandLandmarks) return;

const lm = results.multiHandLandmarks[0];

const fingers = [

  lm[8].y < lm[6].y,

  lm[12].y < lm[10].y,

  lm[16].y < lm[14].y,

  lm[20].y < lm[18].y

];

const thumbOpen =
Math.abs(lm[4].x - lm[3].x) > 0.05;

let openCount =
fingers.filter(Boolean).length;

if (thumbOpen)
openCount++;

  if (openCount >= 4) {

  if (particleMode !== "idle") {

    particleMode = "idle";

    setIdleMode();

  }

}

else if (openCount === 0) {

  if (particleMode !== "cluster") {

    particleMode = "cluster";

    setClusterMode();

  }

}
  
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
