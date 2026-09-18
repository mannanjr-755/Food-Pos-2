import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/sidebar/Sidebar';
import Header from '@/components/header/Header';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1024px)');
    const onMobile = (e: MediaQueryList | MediaQueryListEvent) => setSidebarCollapsed(e.matches);
    onMobile(mql);
    mql.addEventListener('change', onMobile);
    return () => mql.removeEventListener('change', onMobile);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}