import firebase from 'firebase';
import { useState } from 'react';
import createUseContext from 'constate';

const firebaseConfig = {
    apiKey: 'AIzaSyCTYvodP0p2y2HF27qMhOET-jPmQ9AZg3I',
    authDomain: 'egentrening.firebaseapp.com',
    databaseURL: 'https://egentrening.firebaseio.com',
    projectId: 'egentrening',
    storageBucket: 'egentrening.appspot.com',
    messagingSenderId: '1044721297199',
    appId: '1:1044721297199:web:c1a9891eb8e491e4de63da',
    measurementId: 'G-V97XZE49RK',
};
firebase.initializeApp(firebaseConfig);

const [FirebaseProvider, useFirebase] = createUseContext(() => {
    const [authenticated, settAuthenticated] = useState(false);
    const [user, settUser] = useState<firebase.User | null>(null);

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    firebase.auth().useDeviceLanguage();
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            settUser(user);
            settAuthenticated(true);
        } else {
            firebase
                .auth()
                .signInWithPopup(provider)
                .then(result => {
                    console.log(result);
                    settAuthenticated(true);
                    settUser(result.user);
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
    });

    return {
        authenticated,
        user,
        firebase,
    };
});

export { FirebaseProvider, useFirebase };
