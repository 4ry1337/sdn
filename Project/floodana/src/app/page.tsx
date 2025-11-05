'use client';

import { TopologyViewer } from '@/features/topology-viewer';

export default function Home() {
  return (
    <div className="min-h-screen p-8 font-sans bg-background">
      <main className="max-w-[1400px] mx-auto">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">FloodAna</h1>
              <p className="text-muted-foreground mt-1">
                SDN Network Visualizer for Floodlight Controller
              </p>
            </div>
            <p className="text-sm text-muted-foreground">v1.0.0</p>
          </div>

          <TopologyViewer />
        </div>
      </main>
    </div>
  );
}

