import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from "@/shared/ui/sidebar";

export default function SidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider defaultOpen={false} className="flex flex-col">
        <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
          <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
            <a href="#">
              <h1 className="text-base font-medium">OpenVis</h1>
            </a>
            <SidebarTrigger className="ml-auto rotate-180" />
          </div>
        </header>
        <div className="flex flex-1">
          <SidebarInset>
            {children}
          </SidebarInset>
          <Sidebar side="right" className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
            <SidebarHeader>
            </SidebarHeader>
            <SidebarContent>
            </SidebarContent>
            <SidebarFooter>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
        </div>
      </SidebarProvider>
    </div>
  )
}

