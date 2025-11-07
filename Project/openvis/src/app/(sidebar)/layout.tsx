import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar";
import { ChargeStrengthControls, ForceStrengthControls, LinkDistanceControls } from "@/widgets/topology_viewer";

export default function SidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "24rem",
          } as React.CSSProperties
        }
        defaultOpen={false}
        className="flex flex-col"
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
          <Sidebar side="right" variant="floating" className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
            <SidebarHeader>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Graph Controls</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <ForceStrengthControls />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <LinkDistanceControls />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <ChargeStrengthControls />
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
            </SidebarFooter>
          </Sidebar>
        </div>
      </SidebarProvider>
    </div>
  )
}

