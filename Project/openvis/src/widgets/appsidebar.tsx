import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/shared/ui/sidebar";
import { GraphForceControls } from "./force_controls";
import { GraphFilterControls } from "./node_filters";

export const AppSidebar = () => {
  return <Sidebar side="right" variant="floating" className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
    <SidebarHeader>
    </SidebarHeader>
    <SidebarContent>
      <GraphForceControls />
      <GraphFilterControls />
    </SidebarContent>
    <SidebarFooter>
    </SidebarFooter>
  </Sidebar>;
}
