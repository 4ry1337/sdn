import { GraphViewer } from "@/widgets/graph_viewer";

export default async function GraphPage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-2 p-2">
      <div className="bg-muted/50 border rounded-lg flex flex-1"  >
        <GraphViewer />
      </div>
      <div className="flex justify-center p-2 bg-muted/50 border rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">
            💡 Tip: Drag nodes to reposition • Scroll to zoom • Drag background to pan
          </p>
        </div>
      </div>
    </div >
  )
}
