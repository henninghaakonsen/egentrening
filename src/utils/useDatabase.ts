import firebase from 'firebase';
import { useEffect, useState } from 'react';
import {
    byggDataRessurs,
    byggFeiletRessurs,
    byggHenterRessurs,
    byggTomRessurs,
    Ressurs,
    RessursStatus,
} from '../typer/ressurs';
import { Aktivitet, AktivitetID, initiellProfil, Profil } from '../typer/typer';

const profilCollection = 'profil';

const useDatabase = (db: firebase.firestore.Firestore, user: firebase.User | null) => {
    const [aktiviteter, settAktiviteter] = useState<Aktivitet[]>([]);
    const [profil, settProfil] = useState<Ressurs<Profil>>(byggTomRessurs());

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
            db.collection(profilCollection)
                .doc(user.uid)
                .set(initiellProfil)
                .then(() => {
                    settProfil(byggDataRessurs(initiellProfil));
                });
        }
    };

    const hentProfil = () => {
        settProfil(byggHenterRessurs());
        if (user?.uid !== undefined) {
            db.collection(profilCollection)
                .doc(user.uid)
                .get()
                .then((doc: any) => {
                    if (doc.exists) {
                        settProfil(byggDataRessurs(doc.data()));
                    } else {
                        initialiserProfil();
                    }
                });
        } else {
            settProfil(byggFeiletRessurs('Finner ikke profil'));
        }
    };

    const oppdaterUkesmål = (aktivitetId: AktivitetID, nyttUkesmål: number) => {
        if (profil.status === RessursStatus.SUKSESS && user?.uid !== undefined) {
            const nyProfil: Profil = {
                ...profil.data,
                mineMål: {
                    ...profil.data.mineMål,
                    [aktivitetId]: nyttUkesmål,
                },
            };

            db.collection(profilCollection)
                .doc(user.uid)
                .set(nyProfil)
                .then(() => {
                    settProfil(byggDataRessurs(nyProfil));
                });
        }
    };

    useEffect(() => {
        hentAktiviteter();
        hentProfil();
    }, [user]);

    return {
        aktiviteter,
        oppdaterUkesmål,
        profil,
    };
};

export default useDatabase;
