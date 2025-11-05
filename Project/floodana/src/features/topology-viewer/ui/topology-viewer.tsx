'use client';

import { useD3Graph } from '../hooks/use-d3-graph';
import { useTopology } from '../hooks/use-topology';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export function TopologyViewer() {
  const { topology, isLoading, error, lastUpdate, refetch } = useTopology();
  const { svgRef, isReady, resetZoom, centerGraph } = useD3Graph({
    nodes: topology.nodes,
    links: topology.links,
    width: 1200,
    height: 700,
  });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Network Topology</h2>
          
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          )}

          {!isLoading && lastUpdate && (
            <div className="text-sm text-muted-foreground">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetZoom}
            disabled={!isReady}
          >
            <ZoomOut className="h-4 w-4 mr-2" />
            Reset Zoom
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={centerGraph}
            disabled={!isReady}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Center
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="font-semibold">Error loading topology:</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}

      <div className="relative bg-muted/20 rounded-lg overflow-hidden border">
        <svg
          ref={svgRef}
          className="w-full h-auto"
          style={{ minHeight: '700px', cursor: 'grab' }}
        />

        {!isLoading && topology.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-semibold mb-2">No network devices detected</p>
              <p className="text-sm">Start Mininet topology to see the network</p>
              <code className="block mt-4 p-2 bg-background rounded text-xs">
                sudo python mininet/01_simple_wifi_topology.py
              </code>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 p-3 bg-background/90 backdrop-blur rounded-lg border text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
              <span>Switch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
              <span>Host</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
              <span>Controller</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            {topology.nodes.length} nodes • {topology.links.length} links
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        <p>💡 Tip: Drag nodes to reposition • Scroll to zoom • Drag background to pan</p>
      </div>
    </Card>
  );
}
