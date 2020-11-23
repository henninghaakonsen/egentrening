import { Button, ChakraProvider, Heading, Text } from '@chakra-ui/react';
import React from 'react';
import { useFirebase } from './utils/firebase';

const App: React.FC = () => {
    const { authenticated, loggInn, user } = useFirebase();

    return (
        <ChakraProvider>
            <Heading>Velkommen til egentrening</Heading>
            {authenticated ? (
                <Text>{user?.displayName}</Text>
            ) : (
                <Button onClick={loggInn}>Logg inn</Button>
            )}
        </ChakraProvider>
    );
};

export default App;
