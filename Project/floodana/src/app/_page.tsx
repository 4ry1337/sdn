export default function Home() {
  return (
    <main className="h-screen mx-auto">
      <div className="flex flex-row gap-8 items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">FloodAna</h1>
          <p className="text-muted-foreground mt-1">
            SDN Network Visualizer for Floodlight Controller
          </p>
        </div>
        <p className="text-sm text-muted-foreground">v1.0.0</p>
      </div>
    </main>
  );
}


