'use client';

import { usePathname } from 'next/navigation';
import RenterSidebar from './RenterSidebar';

export default function RenterSidebarWrapper() {
  const pathname = usePathname();
  return <RenterSidebar pathname={pathname} />;
}
