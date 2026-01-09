'use client';

import { usePathname } from 'next/navigation';
import LandlordSidebar from './LandlordSidebar';
import type { OrgRole } from '@/app/landlord/layout';

interface LandlordSidebarWrapperProps {
  userRole: OrgRole;
}

export default function LandlordSidebarWrapper({ userRole }: LandlordSidebarWrapperProps) {
  const pathname = usePathname();
  return <LandlordSidebar pathname={pathname} userRole={userRole} />;
}
