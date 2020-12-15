import firebase from 'firebase';
import { useEffect, useState } from 'react';
import { Aktivitet, initiellProfil, Profil } from '../typer';

const profilCollection = 'profil';

const useDatabase = (db: firebase.firestore.Firestore, user: firebase.User | null) => {
    const [aktiviteter, settAktiviteter] = useState<Aktivitet[]>([]);
    const [profil, settProfil] = useState<Profil>(initiellProfil);

    const hentAktiviteter = async () => {
        return await db
            .collection('aktiviteter')
            .get()
            .then((querySnapshot: any) => {
                const data = querySnapshot.docs.map((doc: any) => doc.data());
                settAktiviteter(data);
            });
    };

    const initialiserProfil = () => {
        if (user?.uid !== undefined) {
            db.collection(profilCollection).doc(user.uid).set(initiellProfil);
        }
    };

    const hentProfil = () => {
        if (user?.uid !== undefined) {
            db.collection(profilCollection)
                .doc(user.uid)
                .get()
                .then((doc: any) => {
                    if (doc.exists) {
                        settProfil(doc.data());
                    } else {
                        initialiserProfil();
                    }
                });
        }
    };

    useEffect(() => {
        hentAktiviteter();
        hentProfil();
    }, [user]);

    console.log(profil);
    return {
        aktiviteter,
        profil,
    };
};

export default useDatabase;
