// React
import { FaHome, FaGithub } from 'react-icons/fa';
import { MdOutlineTipsAndUpdates } from 'react-icons/md';

export const sidePanelButtons = [
  {
    link: '/',
    icon: <FaHome style={{ width: '40px', height: '40px' }} />,
    tooltip: 'Home',
    newTab: false,
  },
  {
    link: '/Changelog',
    icon: <MdOutlineTipsAndUpdates style={{ width: '40px', height: '40px' }} />,
    tooltip: 'Changelog',
    newTab: false,
  },
  {
    link: 'https://github.com/honkita/Last.fm-Stats-Organizer',
    icon: <FaGithub style={{ width: '40px', height: '40px' }} />,
    tooltip: 'GitHub',
    newTab: true,
  },
];
