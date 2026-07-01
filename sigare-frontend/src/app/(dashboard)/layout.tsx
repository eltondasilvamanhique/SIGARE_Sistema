'use client';

import { useState } from 'react';
import DashboardNav from '@/components/shared/DashboardNav';
import NotificationBell from '@/components/shared/NotificationBell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarAberta, setSidebarAberta] = useState(false);

  return (
    <div className="flex min-h-screen">
      <DashboardNav isOpen={sidebarAberta} onClose={() => setSidebarAberta(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Botão hambúrguer — só em mobile */}
            <button
              onClick={() => setSidebarAberta(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0f2554] transition-colors"
              aria-label="Abrir menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="h-1 w-8 rounded-full bg-[#e9b94e] hidden lg:block" />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-slate-400 font-medium tracking-wide uppercase">
              SIGARE · Xai-Xai, Gaza
            </span>
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 bg-[#f8f9fc]">{children}</main>
      </div>
    </div>
  );
}
