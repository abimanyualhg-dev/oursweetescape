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
   AUDIO
========================= */

const ringtone =
new Audio("ringing.mp3");

ringtone.loop = true;

const connectedSound =
new Audio("connected.mp3");

/* unlock audio browser */
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
   GET MEDIA
========================= */

async function initMedia() {

if (localStream) return;

localStream =
await navigator.mediaDevices.getUserMedia({
audio:true,
video:false
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

await setDoc(roomRef,{
candidates: arrayUnion(
JSON.stringify(event.candidate)
)
},{ merge:true });

}

};

peerConnection.onconnectionstatechange =
() => {

console.log(
"STATE:",
peerConnection.connectionState
);

};

}

/* =========================
   START CALL
========================= */

startBtn.onclick = async () => {

hasCreatedOffer = false;
hasSetRemote = false;

if (peerConnection) {

peerConnection.close();

peerConnection = null;

}

remoteAudio.srcObject = null;

await initMedia();

createPeer();

/* UI CALLER */

popup.classList.add("show");

incomingButtons.style.display =
"none";

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

/* PLAY RINGTONE */

try {

ringtone.currentTime = 0;

await ringtone.play();

} catch(e) {
console.log(e);
}

/* CLEAR OLD */

await setDoc(roomRef,{
answer:null,
candidates:[]
},{ merge:true });

/* CREATE OFFER */

const offer =
await peerConnection.createOffer();

await peerConnection.setLocalDescription(
offer
);

hasCreatedOffer = true;

/* SEND */

await setDoc(roomRef,{
calling:true,
caller:currentUser,
offer:JSON.stringify(offer),
candidates:[]
});

};

/* =========================
   ACCEPT BUTTON
========================= */

async function fakeAccept() {

ringtone.pause();

ringtone.currentTime = 0;

connectedSound.currentTime = 0;

connectedSound.play().catch(()=>{});

callText.textContent =
"CONNECTED";

callImage.src =
"imageoncall.jpg";

incomingButtons.style.display =
"none";

}

/* ACCEPT */

acceptBtn.onclick = async () => {

await fakeAccept();

};

/* DON'T REJECT */

rejectBtn.onclick = async () => {

await fakeAccept();

};

/* =========================
   END CALL
========================= */

closeBtn.onclick = async () => {

await setDoc(roomRef,{
calling:false,
caller:null,
offer:null,
answer:null,
candidates:[]
});

popup.classList.remove("show");

ringtone.pause();
ringtone.currentTime = 0;

connectedSound.pause();
connectedSound.currentTime = 0;

if (peerConnection) {

peerConnection.close();

peerConnection = null;

}

remoteAudio.srcObject = null;

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

/* CALL ENDED */

if (!data.calling) {

popup.classList.remove("show");

ringtone.pause();
ringtone.currentTime = 0;

return;

}

/* =========================
   RECEIVER FLOW
========================= */

/* caller jangan render incoming */
if (data.caller === currentUser) {

/* caller dapet answer */

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

return;

}

/* RECEIVER */

popup.classList.add("show");

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

/* PLAY RINGTONE */

try {

ringtone.currentTime = 0;

await ringtone.play();

} catch(e) {
console.log(e);
}

/* WEBRTC */

await initMedia();

createPeer();

/* HANDLE OFFER */

if (
data.offer &&
!hasSetRemote
) {

await peerConnection.setRemoteDescription(
JSON.parse(data.offer)
);

hasSetRemote = true;

const answer =
await peerConnection.createAnswer();

await peerConnection.setLocalDescription(
answer
);

await setDoc(roomRef,{
answer:JSON.stringify(answer)
},{ merge:true });

}

/* ICE */

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

});
