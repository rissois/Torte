import { initializeApp } from 'firebase/app';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "##############",
    authDomain: "##############",
    databaseURL: "##############",
    projectId: "##############",
    storageBucket: "##############",
    messagingSenderId: "##############",
    appId: "##############"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export default firebaseApp