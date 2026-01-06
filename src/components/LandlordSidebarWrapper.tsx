'use client';

import { usePathname } from 'next/navigation';
import LandlordSidebar from './LandlordSidebar';

export default function LandlordSidebarWrapper() {
  const pathname = usePathname();
  return <LandlordSidebar pathname={pathname} />;
}
