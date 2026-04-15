// Client Component
import ChangelogClient from './changelogClient';

// Types
import type { Metadata } from 'next';

// Metadata
export const metadata: Metadata = {
  title: 'Last.fm Enhanced Statistics Changelog',
};

const Changelog = () => {
  return <ChangelogClient />;
};

export default Changelog;
