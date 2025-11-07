import z from "zod";
import { NextRequest, NextResponse } from "next/server";
import { fetch_floodlight_topology } from "@/features/topology/floodlight/read";

const GetFloodlightTopologyQuerySchema = z.object({
  url: z.url('Invalid controller URL'),
})

export async function GET(req: NextRequest) {
  const search_params = req.nextUrl.searchParams
  const params = {
    url: search_params.get("url"),
  }
  const validation = GetFloodlightTopologyQuerySchema.safeParse(params)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Invalid parameters',
        details: validation.error.message
      },
      { status: 400 }
    );
  }
  const { url } = validation.data

  try {
    const topology = await fetch_floodlight_topology(url);
    return NextResponse.json(topology, { status: 200 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error("[FETCH] FLOODLIGHT TOPOLOGY:", errorMessage);
    return NextResponse.json({
      error: 'Failed to fetch Floodlight topology',
      message: errorMessage,
      url
    }, { status: 500 });
  }
}
