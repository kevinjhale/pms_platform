import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import LandlordSidebarWrapper from '@/components/LandlordSidebarWrapper';
import { MobileMenuProvider } from '@/components/MobileMenuProvider';

export type OrgRole = 'owner' | 'admin' | 'manager' | 'staff';

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organization, role } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  return (
    <MobileMenuProvider>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
        }}
      >
        <LandlordSidebarWrapper userRole={(role as OrgRole) || 'staff'} />
        <main
          className="main-content-mobile"
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: '100vh',
          }}
        >
          {children}
        </main>
      </div>
    </MobileMenuProvider>
  );
}
