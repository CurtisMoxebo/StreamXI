import React, { useState } from 'react';
import { Header } from './Header.js';
import { SideDrawer } from './SideDrawer.js';
import { Footer } from './Footer.js';

interface LayoutProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  searchQuery = '',
  onSearchChange = () => {},
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="bg-surface-900 text-slate-100 min-h-screen font-sans flex flex-col antialiased">
      <Header
        onOpenDrawer={() => setIsDrawerOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <Footer />
    </div>
  );
};
