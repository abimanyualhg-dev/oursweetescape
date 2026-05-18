import { db } from "./firebase.js";

import {
doc,
setDoc,
onSnapshot,
arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const currentUser =
localStorage.getItem("loggedInUser");

const roomRef =
doc(db,"calls","ag-room");

const popup =
document.getElementById("callPopup");

const startBtn =
document.getElementById("startCallBtn");

const closeBtn =
document.getElementById("closeCallPopup");

const remoteAudio =
document.getElementById("remoteAudio");

/* =========================
   UI ELEMENTS
========================= */

const callText =
document.getElementById("callText");

const callImage =
document.getElementById("callImage");

const incomingButtons =
document.getElementById("incomingButtons");

const acceptBtn =
document.getElementById("acceptBtn");

const rejectBtn =
document.getElementById("rejectBtn");

/* =========================
   AUDIO FILES
========================= */

/* 🔥 LANGSUNG PANGGIL FILE */
const ringtone = new Audio("./ringing.mp3");

ringtone.loop = true;

const connectedSound =
new Audio("./connected.mp3");

/* unlock browser audio */
document.body.addEventListener("click", async () => {

try {

await ringtone.play();
ringtone.pause();
ringtone.currentTime = 0;

await connectedSound.play();
connectedSound.pause();
connectedSound.currentTime = 0;

} catch(e) {
console.log(e);
}

}, { once:true });

/* =========================
   WEBRTC CORE
========================= */

let localStream;
let peerConnection;

let hasCreatedOffer = false;
let hasSetRemote = false;

const servers = {
iceServers: [
{ urls: "stun:stun.l.google.com:19302" }
]
};

/* =========================
   GET MIC
========================= */

async function initMedia() {

if (localStream) return;

localStream =
await navigator.mediaDevices.getUserMedia({
audio: true,
video: false
});

}

/* =========================
   CREATE PEER
========================= */

function createPeer() {

if (peerConnection) return;

peerConnection =
new RTCPeerConnection(servers);

localStream.getTracks().forEach(track => {

peerConnection.addTrack(
track,
localStream
);

});

peerConnection.ontrack = (event) => {

remoteAudio.srcObject =
event.streams[0];

remoteAudio.play().catch(()=>{});

};

peerConnection.onicecandidate =
async (event) => {

if (event.candidate) {

await setDoc(roomRef, {
candidates: arrayUnion(
JSON.stringify(event.candidate)
)
}, { merge: true });

}

};

peerConnection.onconnectionstatechange =
() => {

console.log(
"STATE:",
peerConnection.connectionState
);

if (
peerConnection.connectionState ===
"connected"
) {

/* 🔥 STOP RINGTONE */
ringtone.pause();

ringtone.currentTime = 0;

/* 🔥 PLAY CONNECTED SOUND */
connectedSound.currentTime = 0;

connectedSound.play().catch(err => {
console.log(err);
});

/* UI */
callText.textContent =
"CONNECTED";

callImage.src =
"imageoncall.jpg";

incomingButtons.style.display =
"none";

}

};

}

/* =========================
   START CALL
========================= */

startBtn.onclick = async () => {

/* RESET */
hasCreatedOffer = false;
hasSetRemote = false;

if (peerConnection) {

peerConnection.close();

peerConnection.ontrack = null;
peerConnection.onicecandidate = null;
peerConnection.onconnectionstatechange = null;

peerConnection = null;

}

remoteAudio.srcObject = null;

/* INIT */
await initMedia();

createPeer();

/* SHOW POPUP */
popup.classList.add("show");

incomingButtons.style.display =
"none";

/* UI */
if (currentUser === "ayah") {

callText.textContent =
"CALLING BUNDA...";

callImage.src =
"ayahringing.jpg";

} else {

callText.textContent =
"CALLING AYAH...";

callImage.src =
"bundaringing.jpg";

}

/* 🔥 PLAY RINGTONE */
try {

ringtone.currentTime = 0;

await ringtone.play();

} catch(err) {

console.log(err);

}

/* CLEAR OLD STATE */
await setDoc(roomRef, {
answer: null,
candidates: []
}, { merge:true });

/* OFFER */
const offer =
await peerConnection.createOffer();

await peerConnection.setLocalDescription(
offer
);

hasCreatedOffer = true;

/* SEND */
await setDoc(roomRef, {
calling: true,
caller: currentUser,
offer: JSON.stringify(offer),
candidates: []
});

};

/* =========================
   ACCEPT CALL
========================= */

async function acceptCall() {

/* STOP RINGTONE */
ringtone.pause();

ringtone.currentTime = 0;

/* PLAY CONNECTED SOUND */
connectedSound.currentTime = 0;

connectedSound.play().catch(err => {
console.log(err);
});

/* HANDLE OFFER */
if (
pendingOffer &&
peerConnection &&
!hasSetRemote
) {

await peerConnection.setRemoteDescription(
pendingOffer
);

hasSetRemote = true;

const answer =
await peerConnection.createAnswer();

await peerConnection.setLocalDescription(
answer
);

await setDoc(roomRef, {
answer: JSON.stringify(answer)
}, { merge:true });

}

/* UI */
callText.textContent =
"CONNECTED";

callImage.src =
"imageoncall.jpg";

incomingButtons.style.display =
"none";

}

/* =========================
   END CALL
========================= */

closeBtn.onclick = async () => {

/* FIREBASE RESET */
await setDoc(roomRef, {
calling: false,
caller: null,
offer: null,
answer: null,
candidates: []
});

/* HIDE */
popup.classList.remove("show");

/* AUDIO RESET */
ringtone.pause();
ringtone.currentTime = 0;

connectedSound.pause();
connectedSound.currentTime = 0;

/* PEER RESET */
if (peerConnection) {

peerConnection.close();

peerConnection.ontrack = null;
peerConnection.onicecandidate = null;
peerConnection.onconnectionstatechange = null;

peerConnection = null;

}

/* AUDIO STREAM RESET */
remoteAudio.srcObject = null;

/* LOCAL RESET */
localStream = null;

hasCreatedOffer = false;
hasSetRemote = false;

};

/* =========================
   REALTIME LISTENER
========================= */

onSnapshot(roomRef, async (docSnap) => {

if (!docSnap.exists()) return;

const data = docSnap.data();

/* =========================
   RECEIVER FLOW
========================= */

if (!data.calling) return;

/* JANGAN PROSES DEVICE CALLER */
if (data.caller === currentUser) return;

/* BARU RECEIVER */
) {

popup.classList.add("show");

/* UI */
incomingButtons.style.display =
"flex";

if (data.caller === "ayah") {

callText.textContent =
"Ayah is calling...";

callImage.src =
"ayahringing.jpg";

} else {

callText.textContent =
"Bunda is calling...";

callImage.src =
"bundaringing.jpg";

}

/* 🔥 PLAY RINGTONE */
try {

ringtone.currentTime = 0;

await ringtone.play();

} catch(err) {

console.log(err);

}

/* INIT */
await initMedia();

createPeer();

/* HANDLE OFFER */
if (
data.offer &&
!hasSetRemote
) {

pendingOffer =
JSON.parse(data.offer);

}

}

}

/* =========================
   CALLER GET ANSWER
========================= */

if (
data.answer &&
peerConnection &&
hasCreatedOffer
) {

try {

await peerConnection.setRemoteDescription(
JSON.parse(data.answer)
);

} catch(e) {}

}

/* =========================
   ICE CANDIDATES
========================= */

if (
data.candidates &&
peerConnection
) {

for (let c of data.candidates) {

try {

await peerConnection.addIceCandidate(
JSON.parse(c)
);

} catch(e) {}

}

}

/* =========================
   CALL ENDED
========================= */

if (!data.calling) {

popup.classList.remove("show");

ringtone.pause();
ringtone.currentTime = 0;

}

});
