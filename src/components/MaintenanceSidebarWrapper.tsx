'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import MaintenanceSidebar from './MaintenanceSidebar';

export default function MaintenanceSidebarWrapper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return <MaintenanceSidebar pathname={pathname} searchParams={searchParams.toString()} />;
}
