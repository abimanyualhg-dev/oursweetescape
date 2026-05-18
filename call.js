import { db } from "./firebase.js";

import {
doc,
setDoc,
onSnapshot
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
   WEBRTC CORE SETUP
========================= */

let localStream;
let peerConnection;

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

/* GET MIC */
async function initMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });
}

/* CREATE PEER */
function createPeer() {
  peerConnection = new RTCPeerConnection(servers);

  // kirim audio kita
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // terima audio lawan
  peerConnection.ontrack = (event) => {
    remoteAudio.srcObject = event.streams[0];
  };

  // kirim ICE candidate ke firestore
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      await setDoc(roomRef, {
        candidate: JSON.stringify(event.candidate),
        caller: currentUser
      }, { merge: true });
    }
  };
}

/* =========================
   START CALL (CALLER)
========================= */

startBtn.onclick = async () => {

await initMedia();
createPeer();

popup.classList.add("show");

const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

await setDoc(roomRef, {
calling: true,
caller: currentUser,
offer: JSON.stringify(offer)
});

};

/* =========================
   CLOSE CALL
========================= */

closeBtn.onclick = async () => {

await setDoc(roomRef, {
calling: false,
caller: null,
offer: null,
answer: null,
candidate: null
});

popup.classList.remove("show");

if (peerConnection) {
peerConnection.close();
peerConnection = null;
}

};

/* =========================
   REALTIME LISTENER
========================= */

onSnapshot(roomRef, async (docSnap) => {

if (!docSnap.exists()) return;

const data = docSnap.data();

/* OPEN POPUP IF CALL ACTIVE */
if (data.calling && data.caller !== currentUser) {
popup.classList.add("show");

await initMedia();
createPeer();

/* HANDLE OFFER (RECEIVER) */
if (data.offer && !peerConnection.currentRemoteDescription) {

await peerConnection.setRemoteDescription(
JSON.parse(data.offer)
);

const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);

await setDoc(roomRef, {
answer: JSON.stringify(answer)
}, { merge: true });
}

/* HANDLE ANSWER (CALLER) */
if (data.answer && peerConnection) {
await peerConnection.setRemoteDescription(
JSON.parse(data.answer)
);
}

/* HANDLE ICE */
if (data.candidate && peerConnection) {
try {
await peerConnection.addIceCandidate(
JSON.parse(data.candidate)
);
} catch (e) {}
}

}

/* CLOSE CALL */
if (!data.calling) {
popup.classList.remove("show");
}

});