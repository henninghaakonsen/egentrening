import {
    Button,
    Center,
    ColorModeProvider,
    Heading,
    Text,
    Flex,
    theme,
    ThemeProvider,
} from '@chakra-ui/react';
import React from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import Aktiviteter from './components/Aktiviteter';
import Feed from './components/Feed';
import Meny from './components/Meny';
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
                <Flex height={'100vh'} flexDir={'column'}>
                    {authenticated ? (
                        <BrowserRouter>
                            <Center flexDir={'column'}>
                                <Heading>Egentrening</Heading>
                                <Text>{user?.displayName}</Text>
                                <Switch>
                                    <Route path={'/feed'} exact component={Feed} />
                                    <Route
                                        path={'/registrer'}
                                        exact
                                        render={() => {
                                            return <Text>Aktivitet</Text>;
                                        }}
                                    />
                                    <Route path={'/aktiviteter'} exact component={Aktiviteter} />
                                    <Redirect exact path={'/'} to={'/feed'} />
                                </Switch>
                            </Center>
                            <Meny />
                        </BrowserRouter>
                    ) : (
                        <Button onClick={loggInn}>Logg inn</Button>
                    )}
                </Flex>
            </ColorModeProvider>
        </ThemeProvider>
    );
};

export default App;
