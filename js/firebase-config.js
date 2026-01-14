// Firebase sozlamalari
const firebaseConfig = {
    apiKey: "AIzaSyCXud98GdxtDcbwQVO6MN6sTNh4EHnj0to",
    authDomain: "taqlid.firebaseapp.com",
    databaseURL: "https://taqlid-default-rtdb.firebaseio.com",
    projectId: "taqlid",
    storageBucket: "taqlid.firebasestorage.app",
    messagingSenderId: "601727933830",
    appId: "1:601727933830:web:8f58348cadbf5bcd1b6007",
    measurementId: "G-9F13QLPTD1"
};

// Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();