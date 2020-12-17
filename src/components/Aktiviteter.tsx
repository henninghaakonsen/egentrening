import React, { useEffect, useState } from 'react';
import { Box, Heading, VStack, StackDivider, Text, Input, FormControl } from '@chakra-ui/react';
import { Aktivitet, Profil } from '../typer/typer';
import { useFirebase } from '../utils/firebase';

interface Props {
    profil: Profil;
}

const Aktiviteter: React.FC<Props> = ({ profil }) => {
    const { aktiviteter } = useFirebase();

    return (
        <VStack
            style={{ width: '100vw' }}
            spacing={4}
            align="stretch"
            divider={<StackDivider borderColor="gray.200" />}
        >
            {aktiviteter.map((aktivitet: Aktivitet) => (
                <AktivitetBoks key={aktivitet.aktivitetId} aktivitet={aktivitet} profil={profil} />
            ))}
        </VStack>
    );
};

function AktivitetBoks({ aktivitet, profil }: { aktivitet: Aktivitet; profil: Profil }) {
    const { oppdaterUkesmål } = useFirebase();
    const [ukesmål, settUkesmål] = useState<string>('');

    useEffect(() => {
        if (profil.mineMål[aktivitet.aktivitetId]) {
            settUkesmål(profil.mineMål[aktivitet.aktivitetId].toString());
        }
    }, [profil.mineMål]);

    return (
        <Box p={5} margin="0 1rem" borderRadius="lg" shadow="md" borderWidth="1px">
            <Heading fontSize="xl">{aktivitet.navn}</Heading>

            <FormControl width={'80%'}>
                <Text>Ukesmål</Text>
                <Input
                    value={ukesmål}
                    type={'number'}
                    onChange={event => {
                        settUkesmål(event.target.value);
                    }}
                    onBlur={() => {
                        const nyttUkesmål = parseInt(ukesmål, 10);
                        if (
                            ukesmål !== '' &&
                            nyttUkesmål !== profil.mineMål[aktivitet.aktivitetId]
                        ) {
                            oppdaterUkesmål(aktivitet.aktivitetId, nyttUkesmål);
                        }
                    }}
                />
            </FormControl>
        </Box>
    );
}

export default Aktiviteter;
