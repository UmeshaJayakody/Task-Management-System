import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  // Define pages where navbar should NOT be shown
  const pagesWithoutNavbar = ['/signin', '/signup'];
  
  // Check if current page should show navbar
  const shouldShowNavbar = !pagesWithoutNavbar.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      {children}
    </>
  );
}