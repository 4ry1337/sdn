'use client';

import * as d3 from 'd3';
import { Controller } from "@/entities/controller";
import { D3Link, D3Node, GraphFilters, GraphParams } from "./topology.types";
import React from 'react';
import { Node, Link } from "@/entities/graph";
import { storage } from '@/shared/lib/storage';
import { toast } from 'sonner';
import { check_floodlight } from './floodlight/check';

interface GraphContextType {
  nodes: D3Node[];
  links: D3Link[];
  svg_ref: {
    value: SVGSVGElement | null;
    set: (element: SVGSVGElement | null) => void;
  };
  controller: {
    values: Map<string, Controller>;
    connect: (url: string, interval: number) => Promise<void>;
    disconnect: (url: string) => void;
    retry: (url: string) => Promise<void>;
  };
  simulation_params: {
    value: GraphParams;
    update: (params: Partial<GraphParams>) => void;
    reset: () => void;
  }
  filter: {
    values: GraphFilters;
    update: (params: Partial<GraphFilters>) => void;
    reset: () => void;
  }
}

export const GraphContext = React.createContext<GraphContextType | undefined>(undefined);

export function GraphProvider({
  children,
  default_filters,
  default_params
}: {
  children: React.ReactNode,
  default_params: GraphParams,
  default_filters: GraphFilters
}) {
  const [nodes, set_nodes] = React.useState<D3Node[]>([]);
  const [links, set_links] = React.useState<D3Link[]>([]);
  const [controllers, set_controllers] = React.useState<Map<string, Controller>>(new Map());
  const [simulation_params, set_simulation_params] = React.useState<GraphParams>(default_params);
  const [filters, set_filters] = React.useState<GraphFilters>(default_filters);
  const [svg_ref, set_svg_ref] = React.useState<SVGSVGElement | null>(null);
  const [removing_nodes, set_removing_nodes] = React.useState<Set<string>>(new Set());

  const simulation_ref = React.useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const initialized_controllers = React.useRef(false);

  const set_prefix_nodes = React.useCallback((url: string, node_id: string): string => {
    return `${url}::${node_id}`;
  }, []);

  const remove_prefix_nodes = React.useCallback((prefixed_id: string): string => {
    const parts = prefixed_id.split('::');
    return parts.length > 1 ? parts[1] : prefixed_id;
  }, []);

  const topology_changed = React.useCallback((
    existing: { nodes: D3Node[]; links: D3Link[] },
    incoming: { nodes: Node[]; links: Link[] }
  ): boolean => {
    const existing_nodes = new Set(existing.nodes.map(n => n.id));
    const incoming_nodes = new Set(incoming.nodes.map(n => n.id));

    const existing_links = new Set(
      existing.links.map(l => {
        const source = typeof l.source === 'string' ? l.source : l.source.id;
        const target = typeof l.target === 'string' ? l.target : l.target.id;
        return `${source}->${target}`;
      })
    );
    const incoming_links = new Set(incoming.links.map(l => `${l.source}->${l.target}`));

    if (existing_nodes.size !== incoming_nodes.size) return true;
    if (existing_links.size !== incoming_links.size) return true;

    for (const id of existing_nodes) {
      if (!incoming_nodes.has(id)) return true;
    }
    for (const id of existing_links) {
      if (!incoming_links.has(id)) return true;
    }

    return false;
  }, []);

  //  Trigger fade-out animation for removed nodes
  const trigger_fade_out = React.useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;

    set_removing_nodes(prev => new Set([...prev, ...nodeIds]));

    if (svg_ref) {
      nodeIds.forEach(id => {
        d3.select(svg_ref)
          .select(`#node-${id.replace(/:/g, '-')}`)
          .transition()
          .duration(2500)
          .style('opacity', 0);
      });
    }

    setTimeout(() => {
      set_nodes(prev => prev.filter(n => !nodeIds.includes(n.id)));
      set_links(prev => {
        return prev.filter(l => {
          const source = typeof l.source === 'string' ? l.source : l.source.id;
          const target = typeof l.target === 'string' ? l.target : l.target.id;
          return !nodeIds.includes(source) && !nodeIds.includes(target);
        });
      });
      set_removing_nodes(prev => {
        const next = new Set(prev);
        nodeIds.forEach(id => next.delete(id));
        return next;
      });
    }, 2500);
  }, [svg_ref]);

  const save_controllers = React.useCallback((controllers: Map<string, Controller>) => {
    const controllersArray = Array.from(controllers.values()).map(c => ({
      url: c.url,
      interval: c.interval,
    }));
    storage.set('controllers', controllersArray);
  }, []);

  const save_simulation_params = React.useCallback((params: GraphParams) => {
    storage.set('simulation_params', params);
  }, []);

  const merge_topology = React.useCallback((url: string, incoming: { nodes: Node[]; links: Link[] }) => {
    set_nodes(prev_nodes => {
      set_links(prev_links => {
        // Prefix incoming node IDs
        const prefixed_incoming = {
          nodes: incoming.nodes.map(n => ({
            ...n,
            id: set_prefix_nodes(url, n.id),
          })),
          links: incoming.links.map(l => ({
            ...l,
            source: set_prefix_nodes(url, l.source),
            target: set_prefix_nodes(url, l.target),
          })),
        };

        if (!topology_changed({ nodes: prev_nodes, links: prev_links }, prefixed_incoming)) {
          console.log('[TOPOLOGY] No changes detected, skipping merge');
          return prev_links;
        }

        console.log('[TOPOLOGY] Changes detected, merging');

        const controller_prefix = `${url}::`;
        const other_nodes = prev_nodes.filter(n => !n.id.startsWith(controller_prefix));
        const existing_controller_nodes = prev_nodes.filter(n => n.id.startsWith(controller_prefix));
        const existing_map = new Map(existing_controller_nodes.map(n => [n.id, n]));
        const existing_ids = new Set(existing_controller_nodes.map(n => n.id));
        const incoming_ids = new Set(prefixed_incoming.nodes.map(n => n.id));
        const removed_ids = Array.from(existing_ids).filter(id => !incoming_ids.has(id));

        const merged_controller_nodes = prefixed_incoming.nodes.map(newNode => {
          const existing = existing_map.get(newNode.id);
          if (existing) {
            return {
              ...newNode,
              x: existing.x,
              y: existing.y,
              vx: existing.vx,
              vy: existing.vy,
              fx: existing.fx,
              fy: existing.fy,
            };
          }
          return newNode;
        });

        const all_nodes = [...other_nodes, ...merged_controller_nodes];

        if (removed_ids.length > 0) {
          trigger_fade_out(removed_ids);
        }

        const other_links = prev_links.filter(l => {
          const source = typeof l.source === 'string' ? l.source : l.source.id;
          return !source.startsWith(controller_prefix);
        });
        const new_links = [...other_links, ...prefixed_incoming.links];

        set_nodes(all_nodes);
        return new_links;
      });
      return prev_nodes;
    });
  }, [set_prefix_nodes, topology_changed, trigger_fade_out]);

  const connect_controller = React.useCallback(async (url: string, interval: number) => {
    if (controllers.has(url)) {
      toast.error(`Already connected to ${url}`);
      return;
    }

    set_controllers(prev => {
      const next = new Map(prev);
      next.set(url, {
        url,
        interval,
        status: 'connecting',
        eventSource: null,
      });
      return next;
    });

    try {
      await check_floodlight(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Health check failed';
      toast.error(message);

      set_controllers(prev => {
        const next = new Map(prev);
        next.set(url, {
          url,
          interval,
          status: 'unreachable',
          eventSource: null,
        });
        save_controllers(next);
        return next;
      });
      throw error;
    }

    const eventSource = new EventSource(
      `/api/topology/floodlight/stream?url=${encodeURIComponent(url)}&i=${interval}`
    );

    eventSource.addEventListener('topology', (e) => {
      try {
        const topology = JSON.parse(e.data);
        merge_topology(url, topology);
      } catch (error) {
        console.error('[TOPOLOGY] Failed to parse topology event:', error);
      }
    });

    eventSource.addEventListener('error', (e: MessageEvent) => {
      try {
        const errorData = JSON.parse(e.data);
        toast.warning(`${url}: ${errorData.message}`);

        if (errorData.code === 'MAX_ERRORS_REACHED' || errorData.code === 'INITIAL_CONNECTION_FAILED') {
          set_controllers(prev => {
            const next = new Map(prev);
            const controller = next.get(url);
            if (controller) {
              controller.status = 'error';
              next.set(url, controller);
              save_controllers(next);
            }
            return next;
          });
          eventSource.close();
        }
      } catch (error) {
        console.error('[TOPOLOGY] Failed to parse error event:', error);
      }
    });

    set_controllers(prev => {
      const next = new Map(prev);
      next.set(url, {
        url,
        interval,
        status: 'connected',
        eventSource,
      });
      save_controllers(next);
      return next;
    });

    toast.success(`Connected to ${url}`);
  }, [controllers, merge_topology, save_controllers]);

  const disconnect_controller = React.useCallback((url: string) => {
    const controller = controllers.get(url);
    if (!controller) return;

    controller.eventSource?.close();

    set_controllers(prev => {
      const next = new Map(prev);
      next.delete(url);
      save_controllers(next);
      return next;
    });

    const controller_prefix = `${url}::`;
    const nodes_to_remove = nodes.filter(n => n.id.startsWith(controller_prefix)).map(n => n.id);
    if (nodes_to_remove.length > 0) {
      trigger_fade_out(nodes_to_remove);
    }

    toast.info(`Disconnected from ${url}`);
  }, [controllers, nodes, trigger_fade_out, save_controllers]);

  const update_simulation_params = React.useCallback((params: Partial<GraphParams>) => {
    set_simulation_params(prev => {
      const updated = { ...prev, ...params };
      // Debounced save will happen in useEffect
      return updated;
    });
  }, []);

  const reset_simulation_params = React.useCallback(() => {
    set_simulation_params(default_params);
    storage.set('simulation_params', default_params);
  }, [default_params]);

  const update_filter = React.useCallback((params: Partial<GraphFilters>) => {
    set_filters(prev => {
      const updated = { ...prev, ...params };
      storage.set('filters', updated);
      return updated;
    });
  }, []);

  const reset_filter = React.useCallback(() => {
    set_filters(default_filters);
    storage.set('filters', default_filters);
  }, [default_filters]);

  const retry_controller = React.useCallback(async (url: string) => {
    const controller = controllers.get(url);
    if (!controller) return;

    set_controllers(prev => {
      const next = new Map(prev);
      const ctrl = next.get(url);
      if (ctrl) {
        ctrl.status = 'connecting';
        next.set(url, ctrl);
      }
      return next;
    });

    try {
      await connect_controller(url, controller.interval);
    } catch (error) {
      console.error(`Failed to retry ${url}:`, error);
    }
  }, [controllers, connect_controller]);

  React.useEffect(() => {
    if (!svg_ref || nodes.length === 0) return;

    const svg = d3.select(svg_ref);
    const width = svg_ref.clientWidth || 800;
    const height = svg_ref.clientHeight || 600;

    svg.selectAll('*').remove();

    const container = svg.append('g').attr('class', 'zoom-container');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('charge', d3.forceManyBody().strength(-simulation_params.repelForce))
      .force('link', d3.forceLink<D3Node, D3Link>(links)
        .id(d => d.id)
        .distance(simulation_params.linkDistance)
        .strength(simulation_params.linkForce)
      )
      .force('center', d3.forceCenter(width / 2, height / 2).strength(simulation_params.centerForce))
      .force('collision', d3.forceCollide<D3Node>().radius(30));

    simulation_ref.current = simulation;

    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, D3Node>('g')
      .data(nodes)
      .join('g')
      .attr('id', d => `node-${d.id.replace(/:/g, '-')}`)
      .attr('class', 'node');

    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => {
        switch (d.type) {
          case 'controller': return '#22c55e'; // green
          case 'switch': return '#3b82f6';     // blue
          case 'host': return '#a855f7';       // purple
          default: return '#6b7280';           // gray
        }
      });

    node.append('text')
      .text(d => remove_prefix_nodes(d.label || d.id))
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#fff');

    const drag = d3.drag<SVGGElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        // Release node to move freely with simulation (Obsidian behavior)
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    node.style('opacity', d => {
      if (d.type === 'controller' && !filters.showControllers) return 0;
      if (d.type === 'switch' && !filters.showSwitches) return 0;
      if (d.type === 'host' && !filters.showHosts) return 0;
      return removing_nodes.has(d.id) ? 0.5 : 1; // Dim nodes that are fading out
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => {
          const source = typeof d.source === 'string' ? nodes.find(n => n.id === d.source) : d.source;
          return source?.x ?? 0;
        })
        .attr('y1', d => {
          const source = typeof d.source === 'string' ? nodes.find(n => n.id === d.source) : d.source;
          return source?.y ?? 0;
        })
        .attr('x2', d => {
          const target = typeof d.target === 'string' ? nodes.find(n => n.id === d.target) : d.target;
          return target?.x ?? 0;
        })
        .attr('y2', d => {
          const target = typeof d.target === 'string' ? nodes.find(n => n.id === d.target) : d.target;
          return target?.y ?? 0;
        });

      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });
    return () => {
      simulation.stop();
    };
  }, [nodes, links, svg_ref, simulation_params, filters, removing_nodes, remove_prefix_nodes]);

  // Debounced save of simulation params
  React.useEffect(() => {
    const timeout_id = setTimeout(() => {
      save_simulation_params(simulation_params);
    }, 500);

    return () => clearTimeout(timeout_id);
  }, [simulation_params, save_simulation_params]);

  React.useEffect(() => {
    if (initialized_controllers.current) return;
    initialized_controllers.current = true;

    const saved_controllers = storage.get<Array<{ url: string; interval: number }>>('controllers');
    if (saved_controllers && saved_controllers.length > 0) {
      saved_controllers.forEach(async ({ url, interval }) => {
        try {
          await connect_controller(url, interval);
        } catch (error) {
          console.log(`Failed to restore controller ${url}:`, error);
        }
      });
    }
  }, [connect_controller]);

  React.useEffect(() => {
    const retryInterval = setInterval(() => {
      controllers.forEach(async (controller, url) => {
        if (controller.status === 'unreachable') {
          try {
            await check_floodlight(url);
            console.log(`[RETRY] Controller ${url} is back online, reconnecting...`);
            await retry_controller(url);
            toast.success(`Reconnected to ${url}`);
          } catch (error) {
            console.log(`[RETRY] Controller ${url} still unreachable`);
            console.error(error)
          }
        }
      });
    }, 30000);
    return () => clearInterval(retryInterval);
  }, [controllers, retry_controller]);

  React.useEffect(() => {
    return () => {
      controllers.forEach(controller => {
        controller.eventSource?.close();
      });
      simulation_ref.current?.stop();
    };
  }, [controllers]);

  const value: GraphContextType = {
    nodes,
    links,
    svg_ref: {
      value: svg_ref,
      set: set_svg_ref,
    },
    simulation_params: {
      value: simulation_params,
      update: update_simulation_params,
      reset: reset_simulation_params,
    },
    filter: {
      values: filters,
      update: update_filter,
      reset: reset_filter,
    },
    controller: {
      values: controllers,
      connect: connect_controller,
      disconnect: disconnect_controller,
      retry: retry_controller,
    },
  };

  return (
    <GraphContext.Provider value={value} >
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  const context = React.useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within TopologyViewerProvider');
  }
  return context;
}
