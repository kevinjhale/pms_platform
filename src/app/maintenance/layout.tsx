import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import MaintenanceSidebarWrapper from '@/components/MaintenanceSidebarWrapper';
import { MobileMenuProvider } from '@/components/MobileMenuProvider';
import { Suspense } from 'react';

export default async function MaintenanceLayout({
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
        <Suspense fallback={<div style={{ width: '250px' }} />}>
          <MaintenanceSidebarWrapper />
        </Suspense>
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
