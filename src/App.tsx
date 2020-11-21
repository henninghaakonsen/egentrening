import React from 'react';
import { useFirebase } from './utils/firebase';

function App() {
    const { authenticated, user } = useFirebase();

    return <div className="App">{authenticated ? user?.displayName : 'Logg inn'}</div>;
}

export default App;
