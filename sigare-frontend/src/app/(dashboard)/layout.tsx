import DashboardNav from '@/components/shared/DashboardNav';
import NotificationBell from '@/components/shared/NotificationBell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
          <div className="h-1 w-10 rounded-full bg-[#e9b94e]" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">
              SIGARE · Xai-Xai, Gaza
            </span>
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-8 bg-[#f8f9fc]">{children}</main>
      </div>
    </div>
  );
}
