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
// TEXT TARGET GENERATOR
// ======================

const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d", {
  willReadFrequently: true
});

const textCache = new Map();

/**
 * Mengubah text menjadi kumpulan koordinat particle
 */
function getTextPoints(text) {

  if (textCache.has(text)) {
    return textCache.get(text);
  }

  // ukuran canvas sementara
  textCanvas.width = canvas.width;
  textCanvas.height = canvas.height;

  textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

  // background hitam
 textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

  // style text
  textCtx.fillStyle = "#fff";
  textCtx.textAlign = "center";
  textCtx.textBaseline = "middle";
  textCtx.font = `bold ${Math.floor(canvas.width * 0.085)}px Arial`;

  const lines = text.split("\n");

// ======================
// AUTO FONT SCALE
// ======================

let fontSize = canvas.width * 0.12;

const maxWidth = canvas.width * 0.75;

do {

    textCtx.font = `bold ${fontSize}px Arial`;

    let widest = 0;

    for (const line of lines) {

        widest = Math.max(
            widest,
            textCtx.measureText(line).width
        );

    }

    if (widest <= maxWidth) break;

    fontSize -= 2;

} while (fontSize > 20);

const lineHeight = fontSize * 1.25;

const totalHeight = lines.length * lineHeight;

const startY =
    (canvas.height - totalHeight) / 2;

lines.forEach((line, i) => {

    textCtx.fillText(

        line,

        canvas.width / 2,

        startY + i * lineHeight

    );

});

console.log(textCtx.measureText("HELLO"));

  const image =
    textCtx.getImageData(
      0,
      0,
      textCanvas.width,
      textCanvas.height
    ).data;

  const points = [];

  // sampling
  const gap = 6;

  for (let y = 0; y < textCanvas.height; y += gap) {

    for (let x = 0; x < textCanvas.width; x += gap) {

      const index =
        (y * textCanvas.width + x) * 4;

      const r = image[index];
const g = image[index + 1];
const b = image[index + 2];
const a = image[index + 3];

if (
    a > 10 &&
    r > 200 &&
    g > 200 &&
    b > 200
) {
    points.push({
        x,
        y
    });
}

    }

  }

console.log(points.length);
console.log(points.slice(0, 10));
  
  textCache.set(text, points);

  return points;

}

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

  const cx = canvas.width * 0.5;
  const cy = canvas.height * 0.25;

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

function setTextMode(text) {

    const points = [...getTextPoints(text)];

    if (!points.length) return;

    // Fisher-Yates Shuffle
    for (let i = points.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [points[i], points[j]] = [points[j], points[i]];
    }

    for (let i = 0; i < stars.length; i++) {

        const p = points[i % points.length];

        stars[i].setTarget(

            p.x + (Math.random() - 0.5) * 2,

            p.y + (Math.random() - 0.5) * 2

        );

    }

}

function setHeartMode() {

    const points = [];

    const scale = Math.min(canvas.width, canvas.height) * 0.18;

    const cx = canvas.width / 2;
    const cy = canvas.height / 4;

    // jumlah titik = jumlah particle
    for (let i = 0; i < stars.length; i++) {

        const t = (i / stars.length) * Math.PI * 2;

        const x = 16 * Math.pow(Math.sin(t), 3);

        const y =
            -(13 * Math.cos(t)
            - 5 * Math.cos(2 * t)
            - 2 * Math.cos(3 * t)
            - Math.cos(4 * t));

        points.push({
            x: cx + x * scale / 18,
            y: cy + y * scale / 18
        });

    }

    // acak penempatan supaya tidak membentuk garis urut
    for (let i = points.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [points[i], points[j]] = [points[j], points[i]];

    }

    for (let i = 0; i < stars.length; i++) {

        stars[i].setTarget(

            points[i].x + (Math.random() - 0.5) * 2,

            points[i].y + (Math.random() - 0.5) * 2

        );

    }

}

for (let i = 0; i < 1200; i++) {
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

let currentGesture = "idle";
let lastHandTime = 0;
const LOST_TIMEOUT = 300;

function changeGesture(newGesture){

    if(currentGesture === newGesture) return;

    currentGesture = newGesture;

    switch(newGesture){

        case "idle":
            setIdleMode();
            break;

        case "center":
            setClusterMode();
            break;

        case "heart":
            setHeartMode();
            break;

        case "believe":
            setTextMode("BELIEVE");
            break;

        case "dream":
            setTextMode("DREAM");
            break;

        case "achieve":
            setTextMode("ACHIEVE");
            break;

        case "growth":
            setTextMode("GROWTH");
            break;
    }

}

const handCanvas = document.getElementById("handCanvas");
const handCtx = handCanvas.getContext("2d");

function resizeHand() {
  console.log(handCanvas.width, handCanvas.height);
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

  // ======================
  // CLEAR
  // ======================

  handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

  // ======================
  // CEK ADA TANGAN
  // ======================

  if (
  !results.multiHandLandmarks ||
  results.multiHandLandmarks.length === 0
  ) {

  if (Date.now() - lastHandTime > LOST_TIMEOUT) {
    changeGesture("idle");
  }

  return;
}

  // ======================
  // GAMBAR SEMUA TANGAN
  // ======================

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
  2.5,
  0,
  Math.PI * 2
);

// Isi titik
handCtx.fillStyle = "#ffb6d9";
handCtx.fill();

// Outline putih tipis
handCtx.lineWidth = 1;
handCtx.strokeStyle = "rgba(255,255,255,0.85)";
handCtx.stroke();

    }
  }

  // ======================
  // GESTURE DETECTION
  // ======================

  const lm = results.multiHandLandmarks[0];
  lastHandTime = Date.now();

  function fingerUp(tip, pip) {
    return lm[tip].y < lm[pip].y;
  }

  const thumb  = lm[4].x > lm[3].x;
  const index  = fingerUp(8, 6);
  const middle = fingerUp(12, 10);
  const ring   = fingerUp(16, 14);
  const pinky  = fingerUp(20, 18);

  // 🖐️ Open Palm
  if (
    thumb &&
    index &&
    middle &&
    ring &&
    pinky
  ) {
    changeGesture("center");
  }

  // ✊ Fist
  else if (
    !index &&
    !middle &&
    !ring &&
    !pinky
  ) {
    changeGesture("heart");
  }

  // ☝️ Index
  else if (
    index &&
    !middle &&
    !ring &&
    !pinky
  ) {
    changeGesture("believe");
  }

  // ✌️ Peace
  else if (
    index &&
    middle &&
    !ring &&
    !pinky
  ) {
    changeGesture("dream");
  }

  // 🤘 Rock
  else if (
    index &&
    !middle &&
    !ring &&
    pinky
  ) {
    changeGesture("achieve");
  }

  // 🤙 Shaka
  else if (
    thumb &&
    !index &&
    !middle &&
    !ring &&
    pinky
  ) {
    changeGesture("growth");
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
