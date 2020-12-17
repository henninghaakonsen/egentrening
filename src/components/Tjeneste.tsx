import { Center, Heading, Spinner, Text } from '@chakra-ui/react';
import React from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import { RessursStatus } from '../typer/ressurs';
import { useFirebase } from '../utils/firebase';
import Aktiviteter from './Aktiviteter';
import Feed from './Feed';
import Meny from './Meny';

const Tjeneste: React.FC = () => {
    const { profil, user } = useFirebase();

    switch (profil.status) {
        case RessursStatus.SUKSESS:
            return (
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
                            <Route
                                path={'/aktiviteter'}
                                exact
                                render={() => <Aktiviteter profil={profil.data} />}
                            />
                            <Redirect exact path={'/'} to={'/feed'} />
                        </Switch>
                    </Center>
                    <Meny />
                </BrowserRouter>
            );
        case RessursStatus.HENTER:
            return <Spinner />;
        default:
            return <div />;
    }
};

export default Tjeneste;
