import * as firebase from 'firebase';

// Optionally import the services that you want to use
//import "firebase/auth";
//import "firebase/database";
import "firebase/firestore";
import "firebase/functions";
//import "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "##########",
    authDomain: "##########",
    databaseURL: "##########",
    projectId: "##########",
    storageBucket: "##########",
    messagingSenderId: "##########",
    appId: "##########"
};

firebase.initializeApp(firebaseConfig);

export default firebase