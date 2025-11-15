import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/shared/ui/sidebar"
import { GraphForceControls } from './force-graph'
import { GraphFilterControls } from './graph/filters'
import { SearchBar } from './search'

export const AppSidebar = () => {
  return (
    <Sidebar side="right" variant="floating" className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
      <SidebarHeader className="p-4">
        <SearchBar />
      </SidebarHeader>
      <SidebarContent>
        <GraphForceControls />
        <GraphFilterControls />
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  )
}
