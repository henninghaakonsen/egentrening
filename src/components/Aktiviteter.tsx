import React, { useState } from 'react';
import {
    Box,
    Heading,
    VStack,
    StackDivider,
    Input,
    NumberInput,
    NumberInputField,
    useDisclosure,
    Button,
    Modal,
    ModalContent,
    ModalOverlay,
    ModalHeader,
    Text,
    ModalBody,
    Flex,
    ModalFooter,
} from '@chakra-ui/react';
import { Aktivitet } from '../typer';
import { useFirebase } from '../utils/firebase';

function VisAktivitet({ aktivitet }: { aktivitet: Aktivitet }) {
    return (
        <Box p={5} margin="0 1rem" borderRadius="lg" shadow="md" borderWidth="1px">
            <Heading fontSize="xl">{aktivitet.navn}</Heading>
        </Box>
    );
}

function LeggTilEllerEndreAktivitet({ aktivitet }: { aktivitet?: Aktivitet }) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [navn, settNavn] = useState(aktivitet?.navn);
    const [ukesmål, settUkesmål] = useState(10);

    return (
        <>
            <Button m={4} pt={2} onClick={onOpen}>
                Ny aktivitet
            </Button>
            <Modal blockScrollOnMount={true} isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader as="h2">{aktivitet ? 'Endre' : 'Legg til'}</ModalHeader>
                    <ModalBody>
                        <Flex flexDir="column" width="80%" as="fieldset" border="unset">
                            <Input
                                placeholder={'Navn på aktivitet'}
                                value={navn}
                                width="full"
                                isRequired
                                onChange={event => settNavn(event.target.value)}
                            />
                            <NumberInput
                                value={ukesmål}
                                mt="1rem"
                                min={1}
                                onChange={(_, valueAsNumber) => settUkesmål(valueAsNumber)}
                            >
                                <NumberInputField placeholder={'Ukesmål'} />
                            </NumberInput>
                            <Text>{`Per år: ${ukesmål ? ukesmål * 12 : '-'}`}</Text>
                        </Flex>
                    </ModalBody>
                    <ModalFooter>
                        <Button>Lagre</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

const Aktiviteter: React.FC = () => {
    const { aktiviteter } = useFirebase();

    return (
        <VStack
            style={{ width: '100vw' }}
            spacing={4}
            align="stretch"
            divider={<StackDivider borderColor="gray.200" />}
        >
            {aktiviteter.map((aktivitet: Aktivitet) => (
                <VisAktivitet key={aktivitet.navn} aktivitet={aktivitet} />
            ))}
            <LeggTilEllerEndreAktivitet />
        </VStack>
    );
};

export default Aktiviteter;
