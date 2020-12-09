import firebase from 'firebase';
import { useEffect, useState } from 'react';
import { Aktivitet } from '../typer';

const useDatabase = (db: firebase.firestore.Firestore) => {
    const [aktiviteter, settAktiviteter] = useState<Aktivitet[]>([]);

    const hentAktiviteter = async () => {
        return await db
            .collection('aktiviteter')
            .get()
            .then((querySnapshot: any) => {
                const data = querySnapshot.docs.map((doc: any) => doc.data());
                settAktiviteter(data);
            });
    };

    useEffect(() => {
        hentAktiviteter();
    }, []);
    console.log(aktiviteter);
    return {
        aktiviteter,
    };
};

export default useDatabase;
