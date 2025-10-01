'use client';

import { usePathname } from 'next/navigation';
import FloatingActionButton from "@/components/FloatingActionButton";

export default function AppContent({ children }) {
  const pathname = usePathname();

  // Define pages where the FAB should NOT be shown
  const publicPages = ['/', '/login', '/privacy', '/terms'];

  // Show FAB only if not on public pages
  const showFAB = !publicPages.includes(pathname) && !pathname.includes('/discussion');

  return (
    <>
      {children}
      {showFAB && <FloatingActionButton />}
    </>
  );
}
