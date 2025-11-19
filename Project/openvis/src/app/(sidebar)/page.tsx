import { GraphViewer } from "@/widgets/graph"
import { FlowStatsPanelConnected, NetworkEventsTimelineConnected } from "@/widgets/stats"

export default async function GraphPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-2 p-2">
      <div className="bg-muted/50 min-h-[70dvh] border rounded-lg flex flex-1"  >
        <GraphViewer />
      </div>
      <div className="bg-muted/50 border rounded-lg p-4">
        <FlowStatsPanelConnected />
      </div>
      <div className="bg-muted/50 border rounded-lg p-4">
        <NetworkEventsTimelineConnected />
      </div>
    </div >
  )
}
