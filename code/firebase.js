import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyATNhEUbp0KRpDIr49FGhMNu_TAvGN015Q",
  authDomain: "training-mind.firebaseapp.com",
  projectId: "training-mind",
  storageBucket: "training-mind.firebasestorage.app",
  messagingSenderId: "881765552611",
  appId: "1:881765552611:web:670632797c0bcbb217d0d6"
};

const app = initializeApp(firebaseConfig);

window.firebaseAuth = getAuth(app);
window.firebaseDB = getFirestore(app);

window.GoogleAuthProvider = GoogleAuthProvider;
window.signInWithPopup = signInWithPopup;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;

window.collection = collection;
window.addDoc = addDoc;
window.getDocs = getDocs;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.doc = doc;
window.query = query;
window.orderBy = orderBy;

window.dispatchEvent(new Event("firebase-ready"));