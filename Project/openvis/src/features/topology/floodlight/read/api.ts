import z from "zod";
import axios, { AxiosError } from "axios";
import { Link, Node } from "@/entities/graph";
import { FloodlightDeviceSchema, FloodlightLinkSchema, FloodlightSwitchSchema } from "./schema";

export async function fetch_floodlight_topology(url: string) {
  try {
    // Fetch all three endpoints in parallel with timeout
    const [switches_response, links_response, devices_response] = await Promise.all([
      axios.get(`${url}/wm/core/controller/switches/json`, { timeout: 5000 }),
      axios.get(`${url}/wm/topology/links/json`, { timeout: 5000 }),
      axios.get(`${url}/wm/device/`, { timeout: 5000 }),
    ]);

    // Validate responses with Zod schemas
    let raw_switches, raw_links, raw_devices;

    try {
      raw_switches = z.array(FloodlightSwitchSchema).parse(switches_response.data);
    } catch (error) {
      throw new Error(`Invalid switch data from Floodlight: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }

    try {
      raw_links = z.array(FloodlightLinkSchema).parse(links_response.data);
    } catch (error) {
      throw new Error(`Invalid link data from Floodlight: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }

    try {
      const { devices } = z.object({ "devices": z.array(FloodlightDeviceSchema) }).parse(devices_response.data);
      raw_devices = devices;
    } catch (error) {
      throw new Error(`Invalid device data from Floodlight: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }

    // Transform to graph entities with safe array access
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
        id: sw.switchDPID || sw.dpid || 'unknown-switch',
        type: 'switch' as const,
        label: sw.switchDPID || sw.dpid || 'Unknown Switch',
        metadata: sw,
      })).filter((node) => node.id !== 'unknown-switch'),
      ...raw_devices.map((device) => ({
        id: device.mac[0] || 'unknown-host',
        type: 'host' as const,
        label: device.mac[0] || 'Unknown Host',
        metadata: device,
      })).filter((node) => node.id !== 'unknown-host'),
    ];

    const links: Link[] = [
      ...raw_switches.map((sw) => ({
        source: 'Floodlight Controller',
        target: sw.switchDPID || sw.dpid || '',
      })).filter((link) => link.target),
      ...raw_links.map((link) => ({
        source: link['src-switch'],
        target: link['dst-switch'],
        metadata: link,
      })),
      ...raw_devices.map((device) => ({
        source: device.mac[0] || '',
        target: device.attachmentPoint?.[0]?.switch || '',
      })).filter((link) => link.source && link.target),
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

  } catch (error) {
    // Handle axios-specific errors with detailed messages
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Timeout error
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error(`Floodlight request timed out after 5s. Controller may be unresponsive at ${url}`);
      }

      // Network error (DNS failure, connection refused, etc.)
      if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
        throw new Error(`Cannot connect to Floodlight controller at ${url}. Check if the controller is running and the URL is correct.`);
      }

      // HTTP error responses (4xx, 5xx)
      if (axiosError.response) {
        const status = axiosError.response.status;
        const endpoint = axiosError.config?.url || 'unknown endpoint';

        if (status === 404) {
          throw new Error(`Floodlight endpoint not found: ${endpoint}. This may be an unsupported Floodlight version.`);
        }

        if (status === 503) {
          throw new Error(`Floodlight controller is unavailable (503). Service may be starting up or overloaded.`);
        }

        if (status >= 500) {
          throw new Error(`Floodlight internal error (${status}) at ${endpoint}. Check controller logs.`);
        }

        throw new Error(`Floodlight API error (${status}): ${axiosError.response.statusText} at ${endpoint}`);
      }
    }

    // Re-throw other errors (validation errors, etc.)
    throw error;
  }
}
