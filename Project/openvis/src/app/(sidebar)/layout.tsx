import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar";
import { AppSidebar } from "@/widgets/appsidebar";

export default function SidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "24rem",
        } as React.CSSProperties
      }
      // defaultOpen={false}
      className="[--header-height:calc(--spacing(14))] flex flex-col"
    >
      <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
        <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
          <a href="#">
            <h1 className="text-base font-medium">OpenVis</h1>
          </a>
          <SidebarTrigger size={"lg"} className="ml-auto rotate-180" />
        </div>
      </header>
      <div className="flex flex-1">
        <SidebarInset>
          {children}
        </SidebarInset>
        <AppSidebar />
      </div>
    </SidebarProvider>
  )
}

