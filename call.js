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
   UI
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
document.getElementById(
"ringtone"
);

const connectedSound =
document.getElementById(
"connectedSound"
);

/* =========================
   WEBRTC
========================= */

let localStream;
let peerConnection;

let hasCreatedOffer = false;
let hasSetRemote = false;
let connectedPlayed = false;

const servers = {
iceServers: [
{
urls:"stun:stun.l.google.com:19302"
}
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
   CONNECTED UI
========================= */

async function showConnectedUI() {

if (connectedPlayed) return;

connectedPlayed = true;

/* stop ringtone */

ringtone.pause();

ringtone.currentTime = 0;

/* play connected */

try {

connectedSound.currentTime = 0;

await connectedSound.play();

} catch(e) {
console.log(e);
}

/* ui */

callText.textContent =
"CONNECTED";

callImage.src =
"imageoncall.jpg";

incomingButtons.style.display =
"none";

}

/* =========================
   START CALL
========================= */

startBtn.onclick = async () => {

connectedPlayed = false;

hasCreatedOffer = false;
hasSetRemote = false;

if (peerConnection) {

peerConnection.close();

peerConnection = null;

}

remoteAudio.srcObject = null;

await initMedia();

createPeer();

/* caller ui */

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

/* ringtone */

try {

ringtone.currentTime = 0;

await ringtone.play();

} catch(e) {
console.log(e);
}

/* clear old */

await setDoc(roomRef,{
calling:true,
caller:currentUser,
offer:null,
answer:null,
accepted:false,
candidates:[]
});

/* create offer */

const offer =
await peerConnection.createOffer();

await peerConnection.setLocalDescription(
offer
);

hasCreatedOffer = true;

/* send offer */

await setDoc(roomRef,{
offer:JSON.stringify(offer)
},{ merge:true });

};

/* =========================
   ACCEPT BUTTON
========================= */

async function fakeAccept() {

/* LOCAL UI */

await showConnectedUI();

/* BROADCAST */

await setDoc(roomRef,{
accepted:true
},{ merge:true });

}

/* accept */

acceptBtn.onclick = async () => {

await fakeAccept();

};

/* don't reject */

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
accepted:false,
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
connectedPlayed = false;

};

/* =========================
   REALTIME LISTENER
========================= */

onSnapshot(roomRef, async (docSnap) => {

if (!docSnap.exists()) return;

const data = docSnap.data();

/* =========================
   CALL ENDED
========================= */

if (!data.calling) {

popup.classList.remove("show");

ringtone.pause();

ringtone.currentTime = 0;

return;

}

/* =========================
   BOTH CONNECTED
========================= */

if (data.accepted) {

await showConnectedUI();

}

/* =========================
   CALLER FLOW
========================= */

if (data.caller === currentUser) {

if (
data.answer &&
peerConnection &&
hasCreatedOffer &&
!peerConnection.currentRemoteDescription
) {

try {

await peerConnection.setRemoteDescription(
JSON.parse(data.answer)
);

} catch(e) {
console.log(e);
}

}

/* ice */

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

return;

}

/* =========================
   RECEIVER FLOW
========================= */

/* 🔥 PENTING:
   JANGAN RENDER ULANG
   KALAU SUDAH CONNECTED
*/

if (!data.accepted) {

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

/* ringtone */

try {

ringtone.currentTime = 0;

await ringtone.play();

} catch(e) {
console.log(e);
}

}

/* webrtc */

await initMedia();

createPeer();

/* handle offer */

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

/* ice */

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
