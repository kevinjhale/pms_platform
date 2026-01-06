import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getOrgContext } from '@/lib/org-context';
import LandlordSidebarWrapper from '@/components/LandlordSidebarWrapper';

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { organization } = await getOrgContext();
  if (!organization) {
    redirect('/onboarding');
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      <LandlordSidebarWrapper />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  );
}
