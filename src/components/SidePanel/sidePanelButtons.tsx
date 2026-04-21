// React
import { FaGithub } from 'react-icons/fa';

// Chakra UI
import { Heading } from '@chakra-ui/react';

// Components
import Emoji from '@/components/Emoji/emoji';

const styling = { height: '5rem' };

export const sidePanelButtons = [
  {
    link: '/',
    icon: (
      <Heading size="2xl">
        <Emoji text={'🎧'} />
      </Heading>
    ),
    tooltip: 'Home',
    newTab: false,
  },
  {
    link: '/Changelog',
    icon: (
      <Heading size="2xl">
        <Emoji text={'✏︎'} />
      </Heading>
    ),
    tooltip: 'Change Log',
    newTab: false,
  },
  {
    link: 'https://github.com/honkita/Last.fm-Stats-Organizer',
    icon: <FaGithub style={styling} />,
    tooltip: 'GitHub',
    newTab: true,
  },
];
