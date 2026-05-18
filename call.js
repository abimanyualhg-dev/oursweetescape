import { db } from "./firebase.js";

import {
doc,
setDoc,
onSnapshot
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

/* START CALL */

startBtn.onclick = async ()=>{

await setDoc(roomRef,{
calling:true,
caller:currentUser
});

popup.classList.add("show");

};

/* CLOSE */

closeBtn.onclick = async ()=>{

await setDoc(roomRef,{
calling:false,
caller:null
});

popup.classList.remove("show");

};

/* LISTEN REALTIME */

onSnapshot(roomRef,(docSnap)=>{

if(!docSnap.exists()) return;

const data = docSnap.data();

if(
data.calling &&
data.caller !== currentUser
){
popup.classList.add("show");
}

if(!data.calling){
popup.classList.remove("show");
}

});