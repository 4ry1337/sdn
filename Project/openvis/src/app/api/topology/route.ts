import z from "zod";
import { NextRequest, NextResponse } from "next/server";
import { fetch_topology } from "@/features/topology/read/api";
import { ControllerTypeSchema } from "@/entities/controller";

const GetTopologyQuerySchema = z.object({
  url: z.url('Invalid controller URL'),
  type: ControllerTypeSchema
})

export async function GET(req: NextRequest) {
  const search_params = req.nextUrl.searchParams
  const params = {
    url: search_params.get("url"),
    type: search_params.get("type"),
  }
  const validation = GetTopologyQuerySchema.safeParse(params)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Invalid parameters',
        details: validation.error.message
      },
      { status: 400 }
    );
  }
  const { url, type } = validation.data

  try {
    const topology = await fetch_topology(url, type);
    return NextResponse.json(topology, { status: 200 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error("[FETCH] TOPOLOGY:", errorMessage);
    return NextResponse.json({
      error: 'Failed to fetch topology',
      message: errorMessage,
      url
    }, { status: 500 });
  }
}
