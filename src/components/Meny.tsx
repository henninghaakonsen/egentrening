import { Link } from 'react-router-dom';
import React from 'react';
import { Flex, IconButton } from '@chakra-ui/react';
import { AddIcon, SettingsIcon, TimeIcon } from '@chakra-ui/icons';

const Meny: React.FC = () => {
    return (
        <Flex as={'nav'} marginTop={'auto'} marginBottom={'1rem'} justifyContent={'space-between'}>
            <Link to={'/feed'}>
                <IconButton
                    aria-label="feed"
                    variant="outline"
                    colorScheme="teal"
                    icon={<TimeIcon />}
                />
            </Link>
            <Link to={'/registrer'}>
                <IconButton
                    aria-label="registrer aktivitet"
                    variant="outline"
                    colorScheme="teal"
                    icon={<AddIcon />}
                />
            </Link>
            <Link to={'/aktiviteter'}>
                <IconButton
                    aria-label="aktiviteter"
                    variant="outline"
                    colorScheme="teal"
                    icon={<SettingsIcon />}
                />
            </Link>
        </Flex>
    );
};
export default Meny;
