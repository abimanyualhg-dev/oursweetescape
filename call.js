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
   NEW UI ELEMENTS
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

const ringtone =
document.getElementById("ringtone");

const connectedSound =
document.getElementById("connectedSound");

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

/* GET MIC */
async function initMedia() {

  if (localStream) return;

  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });
}

/* CREATE PEER */
function createPeer() {

  if (peerConnection) return;

  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {

    remoteAudio.srcObject = event.streams[0];

    remoteAudio.play().catch(()=>{});

  };

  peerConnection.onicecandidate = async (event) => {

    if (event.candidate) {

      await setDoc(roomRef, {
        candidates: arrayUnion(
          JSON.stringify(event.candidate)
        )
      }, { merge: true });

    }
  };

  peerConnection.onconnectionstatechange = () => {

    console.log(
      "STATE:",
      peerConnection.connectionState
    );

    if (
      peerConnection.connectionState ===
      "connected"
    ) {

      ringtone.pause();
      ringtone.currentTime = 0;

      connectedSound.play();

      callText.textContent = "CONNECTED";

      callImage.src = "imageoncall.jpg";

      incomingButtons.style.display = "none";
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

/* OUTGOING UI */

incomingButtons.style.display = "none";

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

ringtone.play();

const offer =
await peerConnection.createOffer();

await peerConnection.setLocalDescription(
offer
);

hasCreatedOffer = true;

await setDoc(roomRef, {
calling: true,
caller: currentUser,
offer: JSON.stringify(offer),
candidates: []
});

};

/* =========================
   ACCEPT BUTTON
========================= */

async function acceptCall() {

ringtone.pause();

ringtone.currentTime = 0;

connectedSound.play();

callText.textContent =
"CONNECTED";

callImage.src =
"imageoncall.jpg";

incomingButtons.style.display =
"none";

}

/* ACCEPT */
acceptBtn.onclick = async () => {
await acceptCall();
};

/* DON'T REJECT */
rejectBtn.onclick = async () => {
await acceptCall();
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
candidates: []
});

popup.classList.remove("show");

ringtone.pause();

ringtone.currentTime = 0;

if (peerConnection) {

peerConnection.close();

peerConnection = null;

}

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
   CALL RECEIVER FLOW
========================= */

if (
data.calling &&
data.caller !== currentUser
) {

popup.classList.add("show");

/* INCOMING UI */

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

ringtone.play();

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

await setDoc(roomRef, {
answer: JSON.stringify(answer)
}, { merge: true });

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

if (!data.calling) {

popup.classList.remove("show");

ringtone.pause();

ringtone.currentTime = 0;

}

});
