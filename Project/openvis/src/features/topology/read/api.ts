import z from "zod";
import { ControllerType } from "@/entities/controller/types";
import { FloodlightDeviceSchema, FloodlightLinkSchema, FloodlightSwitchSchema } from "@/entities/floodlight";
import { Link, Node } from "./types";

export async function fetch_topology(url: string, type: ControllerType) {
  switch (type) {
    case 'floodlight':
      return await fetch_floodlight_topology(url)
    default:
      throw new Error(`Unsupported controller type: ${type}`);
  }
}

async function fetch_floodlight_topology(url: string) {
  const [switches_request, links_request, devices_request] = await Promise.all([
    fetch(`${url}/wm/core/controller/switches/json`, {
      signal: AbortSignal.timeout(5000),
    }),
    fetch(`${url}/wm/topology/links/json`, {
      signal: AbortSignal.timeout(5000),
    }),
    fetch(`${url}/wm/device/`, {
      signal: AbortSignal.timeout(5000),
    }),
  ]);

  if (!switches_request.ok) {
    throw new Error(`Floodlight API error: ${switches_request.statusText}`);
  }
  if (!links_request.ok) {
    throw new Error(`Floodlight API error: ${links_request.statusText}`);
  }
  if (!devices_request.ok) {
    throw new Error(`Floodlight API error: ${devices_request.statusText}`);
  }

  const raw_switches = z.array(FloodlightSwitchSchema).parse(await switches_request.json());
  const raw_links = z.array(FloodlightLinkSchema).parse(await links_request.json());
  const { devices: raw_devices } = z.object({ "devices": z.array(FloodlightDeviceSchema) }).parse(await devices_request.json())

  const nodes: Node[] = [
    {
      id: 'Floodlight Controller',
      type: 'controller',
      label: 'Controller',
      metadata: {
        url: url
      }
    },
    ...raw_switches.map((sw) => ({
      id: sw.switchDPID || sw.dpid || '',
      type: 'switch' as const,
      label: `Switch ${sw.switchDPID || sw.dpid || 'Unknown'}`,
      metadata: sw,
    })),
    ...(raw_devices).map((device) => ({
      id: device.mac[0],
      type: 'host' as const,
      label: device.mac[0],
      metadata: device,
    })),
  ];

  const links: Link[] = [
    ...raw_switches.map((sw) => ({
      source: 'controller',
      target: sw.switchDPID || sw.dpid || '',
    })),
    ...raw_links.map((link) => ({
      source: link['src-switch'],
      target: link['dst-switch'],
      metadata: link,
    })),
    ...(raw_devices).map((device) => ({
      source: device.mac[0],
      target: device.attachmentPoint[0]?.switch,
    })).filter((link) => link.target),
  ];

  return {
    nodes,
    links,
    metadata: {
      url,
      controllerType: 'floodlight' as const,
      timestamp: new Date().toISOString(),
    },
  };
}
