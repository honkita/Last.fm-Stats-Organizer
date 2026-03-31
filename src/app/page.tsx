// Client Component
import HomeClient from './homeClient';

// Types
import type { Metadata } from 'next';

// Metadata
export const metadata: Metadata = {
  title: 'Last.fm Enhanced Statistics',
};

const Home = () => {
  return <HomeClient />;
};

export default Home;
