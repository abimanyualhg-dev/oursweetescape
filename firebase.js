import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {

apiKey: "AIzaSyCLjZH3Gzz35MeFClPuVq3w1ZC0edJvwe0",
authDomain: "our-sweet-escape-call.firebaseapp.com",
projectId: "our-sweet-escape-call",
storageBucket: "our-sweet-escape-call.firebasestorage.app",
messagingSenderId: "223201000219",
appId: "1:223201000219:web:3133c4aac4a23141b071be"

};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);