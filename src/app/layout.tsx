// Chakra UI
import { ChakraUIProvider } from '@/components/ui/provider';

// Chakra UI Snippets
import { Toaster } from '@/components/ui/toaster';

// Components
import SidePanel from '@/components/SidePanel/sidePanel';

// CSS
import './globals.css';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <ChakraUIProvider>
          {children}
          <Toaster />
          <SidePanel />
        </ChakraUIProvider>
      </body>
    </html>
  );
};

export default Layout;
