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


// Global o'zgaruvchilar
let db = null;
let storage = null;

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
    
    // Offline qo'llab-quvvatlash
    db.enablePersistence()
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                console.log('Ko\'p tab ochiq');
            } else if (err.code == 'unimplemented') {
                console.log('Brauzer qo\'llab-quvvatlamaydi');
            }
        });
    
    console.log('✓ Firebase ulandi');
} catch (error) {
    console.error('✗ Firebase xato:', error);
    alert('Firebase ulanishida xatolik! Console ni tekshiring.');
}