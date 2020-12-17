import { Button, ColorModeProvider, Flex, theme, ThemeProvider } from '@chakra-ui/react';
import React from 'react';
import Tjeneste from './components/Tjeneste';
import { useFirebase } from './utils/firebase';

const App: React.FC = () => {
    const { authenticated, loggInn } = useFirebase();

    return (
        <ThemeProvider theme={theme}>
            <ColorModeProvider
                options={{
                    initialColorMode: 'light',
                }}
            >
                <Flex height={'100vh'} flexDir={'column'}>
                    {authenticated ? <Tjeneste /> : <Button onClick={loggInn}>Logg inn</Button>}
                </Flex>
            </ColorModeProvider>
        </ThemeProvider>
    );
};

export default App;
