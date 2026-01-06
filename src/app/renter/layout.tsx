import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import RenterSidebarWrapper from '@/components/RenterSidebarWrapper';
import { MobileMenuProvider } from '@/components/MobileMenuProvider';

export default async function RenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <MobileMenuProvider>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
        }}
      >
        <RenterSidebarWrapper />
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
