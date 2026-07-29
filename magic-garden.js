import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

let handLandmarker;
let video;

const lamps = [
    { x: 735, y: 628, lit: false },
    { x: 1180, y: 628, lit: false },
    { x: 826, y: 637, lit: false },
    { x: 1078, y: 637, lit: false }
];

const glows = [
    document.getElementById("glow1"),
    document.getElementById("glow2"),
    document.getElementById("glow3"),
    document.getElementById("glow4")
];

const starCanvas = document.getElementById("starCanvas");
const starCtx = starCanvas.getContext("2d");

starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;

const wandPath = [];

const stars = [];

for(let i=0;i<800;i++){

    const x = Math.random() * window.innerWidth;
    const y = 20 + Math.random() * 220;

    stars.push({

        x,
        y,

        homeX: x,
        homeY: y,

        targetX: x,
        targetY: y,

        vx:0,
        vy:0,

        size:1.2 + Math.random()*1.5,
        alpha:0.4 + Math.random()*0.6,
        speed:0.01 + Math.random()*0.02,
        phase:Math.random()*Math.PI*2

    });

}

function drawStar(ctx,x,y,r){

    const spikes = 5;
    const inner = r * 0.45;

    let rot = Math.PI / 2 * 3;

    ctx.beginPath();
    ctx.moveTo(x,y-r);

    for(let i=0;i<spikes;i++){

        ctx.lineTo(
            x + Math.cos(rot)*r,
            y + Math.sin(rot)*r
        );

        rot += Math.PI/spikes;

        ctx.lineTo(
            x + Math.cos(rot)*inner,
            y + Math.sin(rot)*inner
        );

        rot += Math.PI/spikes;

    }

    ctx.closePath();
    ctx.fill();

}

function animateStars(){

    starCtx.clearRect(
        0,
        0,
        starCanvas.width,
        starCanvas.height
    );

    stars.forEach(star=>{

        star.phase += star.speed;

        const alpha =
            0.23 +
            Math.sin(star.phase)*0.25;

        starCtx.save();

        starCtx.globalAlpha = alpha;

        starCtx.fillStyle = "#FFF8E7";

        const dx = star.targetX - star.x;
        const dy = star.targetY - star.y;

        star.vx += dx * 0.002;
        star.vy += dy * 0.002;

        star.vx *= 0.95;
        star.vy *= 0.95;

        star.x += star.vx;
        star.y += star.vy;

        drawStar(
            starCtx,
            star.x,
            star.y,
            star.size
        );

        starCtx.restore();

    });

    requestAnimationFrame(animateStars);

}

animateStars();

function turnOffAllLights(){
    glows.forEach(glow=>{
        glow.style.opacity="0";
    });
    lamps.forEach(lamp=>{
        lamp.lit = false;
    });
}

function turnOnLight(index) {
    if (glows[index]) {
        glows[index].style.opacity = "1";
    }
}

const petalImages = [
    "assets/petal1.png",
    "assets/petal2.png",
    "assets/petal3.png",
    "assets/petal4.png"
];

function createPetal(scene, trees, vanishX, vanishY) {

    const petal = document.createElement("img");

    petal.src =
        petalImages[Math.floor(Math.random() * petalImages.length)];

    petal.className = "petal";

    const fromLeft = Math.random() < 0.5;

    const startX = fromLeft
        ? 30 + Math.random() * 200
        : window.innerWidth - 230 + Math.random() * 200;

    // Spawn hanya di area bunga sakura (bagian atas pohon)
    const startY =
        window.innerHeight * 0.18 +
        Math.random() * window.innerHeight * 0.22;

    const targetX =
        vanishX +
        (Math.random() - 0.5) * 18;

    const targetY =
        vanishY +
        (Math.random() - 0.5) * 10;

    const duration =
        1700 +
        Math.random() * 400;

    const startTime = performance.now();

    const rotateSpeed =
        -540 +
        Math.random() * 1080;

    function animate(now) {

        const t = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        let x =
            startX +
            (targetX - startX) * ease;

        let y =
            startY +
            (targetY - startY) * ease;

        const wave =
            Math.sin(t * Math.PI * 5) * 12;

        if (fromLeft)
            x += wave;
        else
            x -= wave;

        petal.style.left = x + "px";
        petal.style.top = y + "px";

        const scale = 1 - t * 0.9;

        petal.style.transform =
            `rotate(${rotateSpeed * t}deg) scale(${scale})`;

        if (t < 0.12) {
            petal.style.opacity = t / 0.12;
        } else if (t < 0.75) {
            petal.style.opacity = 1;
        } else {
            petal.style.opacity =
                1 - ((t - 0.75) / 0.25);
        }

        if (t < 1)
            requestAnimationFrame(animate);
        else
            petal.remove();
    }

    scene.insertBefore(petal, trees);

    // Kasih delay acak biar nggak muncul semua di frame pertama
    petal.style.opacity = 0;

    setTimeout(() => {
        requestAnimationFrame(animate);
    }, Math.random() * 250);
}

function startPetalStorm() {

    const scene = document.getElementById("scene");
    const trees = document.getElementById("foreground-trees");

    const vanishX = window.innerWidth / 2;
    const vanishY = window.innerHeight * 0.62;

    const waves = 17
    const petalsPerWave = 20

    for (let w = 0; w < waves; w++) {

        setTimeout(() => {

            for (let i = 0; i < petalsPerWave; i++) {

                createPetal(scene, trees, vanishX, vanishY);

            }

        }, w * 45);

    }

}

let blowFrames = 0;
let blowCooldown = false;

async function initBlowDetector() {
    console.log("🚀 Memulai Blow Detector...");
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
        console.log("🎤 Mikrofon berhasil diakses!");
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        function detect() {
            analyser.getByteFrequencyData(data);
            let volume = 0;
            for (let i = 0; i < data.length; i++) {
                volume += data[i];
            }
            
            volume /= data.length;
            console.log(volume);

            if (!blowCooldown) {

                if (volume > 80) {
                    blowFrames++;
                } else {
                    blowFrames = 0;
                }

                if (blowFrames >= 6) {

                    console.log("🌬️ BLOW DETECTED!");
                    turnOffAllLights();
                    startPetalStorm();

                    blowCooldown = true;

                    setTimeout(() => {
                        blowCooldown = false;
                        blowFrames = 0;
                    }, 3000);

                }

            }

            requestAnimationFrame(detect);
        }

        detect();

    } catch (err) {

        console.error("❌ Gagal mengakses mikrofon!");
        console.error(err);

    }

}

initBlowDetector();

async function initHandTracking(){

    const vision =
        await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

    handLandmarker =
        await HandLandmarker.createFromOptions(
            vision,
            {

                baseOptions:{
                    modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
                },

                runningMode:"VIDEO",

                numHands:1,

                minHandDetectionConfidence: 0.6,
                minHandPresenceConfidence: 0.6,
                minTrackingConfidence: 0.6,
                
            }
        );

    video =
        document.getElementById("camera");

    const stream =
        await navigator.mediaDevices.getUserMedia({

            video:true

        });

    video.srcObject = stream;

    video.onloadeddata = async () => {

        await video.play();

function trackHands() {
    const results = handLandmarker.detectForVideo(
        video,
        performance.now()
    );

    if (results.landmarks.length > 0) {

        const hand = results.landmarks[0];
        const finger = hand[8];

        const wand = document.getElementById("wand");
        wand.style.display = "block";

        const x = (1 - finger.x) * window.innerWidth;
        const y = finger.y * window.innerHeight;

        wandPath.push({
            x,
            y,
            time: Date.now()
        });

        if (wandPath.length > 40) {
            wandPath.shift();
        }

        if(detectCircle() && !circleCooldown){

            circleCooldown = true;

            console.log("⭕ Circle");

            moveStarsToCenter();

            setTimeout(()=>{

                circleCooldown = false;

            },2000);

        }

        checkLampCollision(x, y);

        wand.style.transform =
            `translate(${x - 35}px, ${y - 85}px) rotate(-25deg)`;

        if(detectInfinity() && !infinityCooldown){

            infinityCooldown = true;

            console.log("∞ Infinity");

            moveStarsToHeart();

            setTimeout(()=>{

                infinityCooldown = false;

            },2000);

        }

    } else {

        document.getElementById("wand").style.display = "none";

        wandPath.length = 0;

        moveStarsHome();

    }

    requestAnimationFrame(trackHands);
}

        trackHands();

        video.style.opacity = "1";

        console.log(video.videoWidth);
        console.log(video.videoHeight);

    };
}

initHandTracking();
console.log("Camera Ready!");

function checkLampCollision(x, y){
    lamps.forEach((lamp, index)=>{
        if(lamp.lit) return;
        const dx = x - lamp.x;
        const dy = y - lamp.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        if(distance < 10){
            lamp.lit = true;
            turnOnLight(index);
            console.log("Lamp", index + 1, "ON");
        }
    });
}

function detectCircle() {

    if (wandPath.length < 25) return false;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    wandPath.forEach(p => {

        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;

    });

    const width = maxX - minX;
    const height = maxY - minY;

    if (width < 120 || height < 120)
        return false;

    const ratio = width / height;

    return ratio > 0.75 && ratio < 1.25;

}

function moveStarsToCenter(){

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 3.5;

    stars.forEach(star=>{

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 120;

        star.targetX =
            cx + Math.cos(angle) * radius;

        star.targetY =
            cy + Math.sin(angle) * radius;

    });

}

function moveStarsToHeart(){

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.25;

    stars.forEach((star, i)=>{

        const t = (i / stars.length) * Math.PI * 2;

        const x = 16 * Math.pow(Math.sin(t),3);

        const y =
            -(13*Math.cos(t)
            -5*Math.cos(2*t)
            -2*Math.cos(3*t)
            -Math.cos(4*t));

        const thickness = 15;

        star.targetX =
            cx + x * 10 + (Math.random() - 0.5) * thickness;

        star.targetY =
            cy + y * 10 + (Math.random() - 0.5) * thickness;

    });

}

function detectInfinity(){

    const width =
    Math.max(...wandPath.map(p=>p.x)) -
    Math.min(...wandPath.map(p=>p.x));

    const height =
        Math.max(...wandPath.map(p=>p.y)) -
        Math.min(...wandPath.map(p=>p.y));

    if(width < 300 || height < 180)
        return false;

    if (wandPath.length < 35) return false;

    let changes = 0;
    let lastDirection = 0;

    for(let i = 1; i < wandPath.length; i++){

        const dx = wandPath[i].x - wandPath[i-1].x;
        const direction = Math.sign(dx);

        if(direction !== 0 &&
           lastDirection !== 0 &&
           direction !== lastDirection){

            changes++;
        }

        if(direction !== 0)
            lastDirection = direction;
    }

    // Harus ada minimal 3 perubahan arah
    if(changes < 3) return false;

    // ===== CEK APAKAH LINTASAN MENYILANG =====

    for(let i = 0; i < wandPath.length - 3; i++){

        const a1 = wandPath[i];
        const a2 = wandPath[i+1];

        for(let j = i+3; j < wandPath.length-1; j++){

            const b1 = wandPath[j];
            const b2 = wandPath[j+1];

            if(intersects(a1,a2,b1,b2)){
                return true;
            }

        }

    }

    return false;

}

function ccw(A,B,C){

    return (C.y-A.y)*(B.x-A.x) >
           (B.y-A.y)*(C.x-A.x);

}

function intersects(A,B,C,D){

    return (
        ccw(A,C,D) != ccw(B,C,D)
        &&
        ccw(A,B,C) != ccw(A,B,D)
    );

}

function moveStarsHome(){

    stars.forEach(star=>{

        star.targetX = star.homeX;
        star.targetY = star.homeY;

    });

}

let infinityCooldown = false;
let circleCooldown = false;
