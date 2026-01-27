import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { DemoBanner } from "@/components/demo-banner";
import { FloatingBranding } from "@/components/floating-branding";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DemoBanner />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />
        <MobileSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:px-16 lg:ml-64 lg:p-8 lg:px-8">
          {children}
        </main>
      </div>
      <FloatingBranding />
    </>
  );
}
