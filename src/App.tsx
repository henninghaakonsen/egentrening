import {
    Button,
    Center,
    ColorModeProvider,
    Heading,
    Text,
    theme,
    ThemeProvider,
} from '@chakra-ui/react';
import React from 'react';
import { useFirebase } from './utils/firebase';

const App: React.FC = () => {
    const { authenticated, loggInn, user } = useFirebase();

    return (
        <ThemeProvider theme={theme}>
            <ColorModeProvider
                options={{
                    initialColorMode: 'light',
                }}
            >
                <Center flexDir={'column'}>
                    <Heading>Egentrening</Heading>
                    {authenticated ? (
                        <Text>{user?.displayName}</Text>
                    ) : (
                        <Button onClick={loggInn}>Logg inn</Button>
                    )}
                </Center>
            </ColorModeProvider>
        </ThemeProvider>
    );
};

export default App;
