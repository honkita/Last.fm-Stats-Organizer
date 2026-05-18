// Chakra UI
import { ChakraUIProvider } from '@/components/ui/provider';

// Chakra UI Snippets
import { Toaster } from '@/components/ui/toaster';

// Contexts
import { LanguageProvider } from '@/contexts/LanguageContext';

// CSS
import './globals.css';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <ChakraUIProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </ChakraUIProvider>
      </body>
    </html>
  );
};

export default Layout;
