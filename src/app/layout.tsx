// Chakra UI
import { ChakraUIProvider } from '@/components/ui/provider';

// Chakra UI Snippets
import { Toaster } from '@/components/ui/toaster';

// CSS
import './globals.css';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <ChakraUIProvider>
          {children}
          <Toaster />
        </ChakraUIProvider>
      </body>
    </html>
  );
};

export default Layout;
