import { NextRequest } from "next/server";
import z from "zod";
import { ControllerTypeSchema } from "@/entities/controller";
import { fetch_topology } from "@/features/topology/read/api";

const default_interval = 5000

const SteamTopologyQuerySchema = z.object({
  url: z.url('Invalid controller URL'),
  type: ControllerTypeSchema,
  i: z.number().nullable()
})

export async function GET(req: NextRequest) {
  const search_params = req.nextUrl.searchParams;
  const params = {
    url: search_params.get("url"),
    type: search_params.get("type"),
    i: search_params.get("i") ? Number(search_params.get("i")) : null
  };

  const validation = SteamTopologyQuerySchema.safeParse(params);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid parameters',
        details: validation.error.message
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { url, type, i } = validation.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(data)));
      };

      const intervalId = setInterval(async () => {
        try {
          const topology = await fetch_topology(url, type);
          sendEvent(topology);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          sendEvent({ error: errorMessage });
        }
      }, i || default_interval);

      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
