import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar"
import { AppSidebar } from "@/widgets/appsidebar"
import { ForceGraphProvider } from '@/widgets/force-graph'
import { GraphViewerProvider } from '@/widgets/graph/context'

export default function SidebarLayout( {
  children,
}: Readonly<{
  children: React.ReactNode
}> ) {
  return (
    <ForceGraphProvider
      default_params={{
        centerForce: 0.5,
        repelForce: 10,
        linkForce: 0.5,
        linkDistance: 250,
      }}
    >
      <GraphViewerProvider
        default_filters={{
          showControllers: true,
          showSwitches: true,
          showHosts: true,
        }}
      >
        <SidebarProvider
          style={
            {
              "--sidebar-width": "24rem",
            } as React.CSSProperties}
          defaultOpen={false}
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
      </GraphViewerProvider>
    </ForceGraphProvider>
  )
}

