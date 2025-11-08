'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { Node, Link } from '@/entities/graph';
import { check_floodlight } from '@/features/topology/floodlight/check';
import { toast } from 'sonner';
import { storage } from '@/shared/lib/storage';

// Extended Node type with D3 simulation properties
export interface D3Node extends Node {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

// Extended Link type for D3
export interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  metadata?: Record<string, unknown>;
}

export interface Controller {
  url: string;
  interval: number;
  status: 'connecting' | 'connected' | 'unreachable' | 'error' | 'disconnected';
  eventSource: EventSource | null;
}

export interface SimulationParams {
  charge: number;
  linkDistance: number;
  centerGravity: number;
}

export interface NodeFilters {
  showControllers: boolean;
  showSwitches: boolean;
  showHosts: boolean;
}

interface TopologyViewerContextType {
  nodes: D3Node[];
  links: D3Link[];
  controllers: Map<string, Controller>;
  simulationParams: SimulationParams;
  filters: NodeFilters;
  svgRef: React.RefObject<SVGSVGElement | null> | null;
  setSvgRef: (ref: React.RefObject<SVGSVGElement | null>) => void;
  connectController: (url: string, interval: number) => Promise<void>;
  disconnectController: (url: string) => void;
  retryController: (url: string) => Promise<void>;
  updateSimulationParams: (params: Partial<SimulationParams>) => void;
  toggleFilter: (nodeType: 'controller' | 'switch' | 'host', enabled: boolean) => void;
  resetSimulationParams: () => void;
}

const TopologyViewerContext = createContext<TopologyViewerContextType | undefined>(undefined);

const DEFAULT_PARAMS: SimulationParams = {
  charge: -150,
  linkDistance: 100,
  centerGravity: 0.1,
};

export function TopologyViewerProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<D3Node[]>([]);
  const [links, setLinks] = useState<D3Link[]>([]);
  const [controllers, setControllers] = useState<Map<string, Controller>>(new Map());
  const [simulationParams, setSimulationParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [filters, setFilters] = useState<NodeFilters>({
    showControllers: true,
    showSwitches: true,
    showHosts: true,
  });
  const [svgRef, setSvgRefState] = useState<React.RefObject<SVGSVGElement | null> | null>(null);
  const [removingNodes, setRemovingNodes] = useState<Set<string>>(new Set());

  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  // Helper: Prefix node ID with controller URL
  const prefixNodeId = useCallback((controllerUrl: string, nodeId: string): string => {
    return `${controllerUrl}::${nodeId}`;
  }, []);

  // Helper: Strip controller prefix for display
  const stripPrefix = useCallback((prefixedId: string): string => {
    const parts = prefixedId.split('::');
    return parts.length > 1 ? parts[1] : prefixedId;
  }, []);

  // Helper: Deep comparison of topologies
  const hasTopologyChanged = useCallback((
    existing: { nodes: D3Node[]; links: D3Link[] },
    incoming: { nodes: Node[]; links: Link[] }
  ): boolean => {
    const existingNodeIds = new Set(existing.nodes.map(n => n.id));
    const incomingNodeIds = new Set(incoming.nodes.map(n => n.id));

    const existingLinkIds = new Set(
      existing.links.map(l => {
        const source = typeof l.source === 'string' ? l.source : l.source.id;
        const target = typeof l.target === 'string' ? l.target : l.target.id;
        return `${source}->${target}`;
      })
    );
    const incomingLinkIds = new Set(incoming.links.map(l => `${l.source}->${l.target}`));

    // Check if sets are equal
    if (existingNodeIds.size !== incomingNodeIds.size) return true;
    if (existingLinkIds.size !== incomingLinkIds.size) return true;

    for (const id of existingNodeIds) {
      if (!incomingNodeIds.has(id)) return true;
    }
    for (const id of existingLinkIds) {
      if (!incomingLinkIds.has(id)) return true;
    }

    return false;
  }, []);

  // Helper: Trigger fade-out animation for removed nodes
  const triggerFadeOut = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;

    setRemovingNodes(prev => new Set([...prev, ...nodeIds]));

    // Fade out in D3
    if (svgRef?.current) {
      nodeIds.forEach(id => {
        d3.select(svgRef.current)
          .select(`#node-${id.replace(/:/g, '-')}`)
          .transition()
          .duration(2500)
          .style('opacity', 0);
      });
    }

    // Remove from state after animation
    setTimeout(() => {
      setNodes(prev => prev.filter(n => !nodeIds.includes(n.id)));
      setLinks(prev => {
        return prev.filter(l => {
          const source = typeof l.source === 'string' ? l.source : l.source.id;
          const target = typeof l.target === 'string' ? l.target : l.target.id;
          return !nodeIds.includes(source) && !nodeIds.includes(target);
        });
      });
      setRemovingNodes(prev => {
        const next = new Set(prev);
        nodeIds.forEach(id => next.delete(id));
        return next;
      });
    }, 2500);
  }, [svgRef]);

  // Persistence helpers
  const saveControllersToStorage = useCallback((controllersList: Map<string, Controller>) => {
    const controllersArray = Array.from(controllersList.values()).map(c => ({
      url: c.url,
      interval: c.interval,
    }));
    storage.set('controllers', controllersArray);
  }, []);

  const saveSimulationParamsToStorage = useCallback((params: SimulationParams) => {
    storage.set('simulation_params', params);
  }, []);

  // Smart merge topology data
  const mergeTopology = useCallback((controllerUrl: string, incoming: { nodes: Node[]; links: Link[] }) => {
    setNodes(prevNodes => {
      setLinks(prevLinks => {
        // Prefix incoming node IDs
        const prefixedIncoming = {
          nodes: incoming.nodes.map(n => ({
            ...n,
            id: prefixNodeId(controllerUrl, n.id),
          })),
          links: incoming.links.map(l => ({
            ...l,
            source: prefixNodeId(controllerUrl, l.source),
            target: prefixNodeId(controllerUrl, l.target),
          })),
        };

        // Deep comparison - skip if no changes
        if (!hasTopologyChanged({ nodes: prevNodes, links: prevLinks }, prefixedIncoming)) {
          console.log('[TOPOLOGY] No changes detected, skipping merge');
          return prevLinks;
        }

        console.log('[TOPOLOGY] Changes detected, merging');

        // Get nodes from this controller only
        const controllerPrefix = `${controllerUrl}::`;
        const otherNodes = prevNodes.filter(n => !n.id.startsWith(controllerPrefix));
        const existingControllerNodes = prevNodes.filter(n => n.id.startsWith(controllerPrefix));

        // Create map of existing nodes for quick lookup
        const existingMap = new Map(existingControllerNodes.map(n => [n.id, n]));

        // Detect removed nodes
        const existingIds = new Set(existingControllerNodes.map(n => n.id));
        const incomingIds = new Set(prefixedIncoming.nodes.map(n => n.id));
        const removedIds = Array.from(existingIds).filter(id => !incomingIds.has(id));

        // Merge nodes - preserve D3 properties
        const mergedControllerNodes = prefixedIncoming.nodes.map(newNode => {
          const existing = existingMap.get(newNode.id);
          if (existing) {
            // Preserve position and velocity
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
          // New node - D3 will initialize
          return newNode;
        });

        // Combine with nodes from other controllers
        const allNodes = [...otherNodes, ...mergedControllerNodes];

        // Trigger fade-out for removed nodes
        if (removedIds.length > 0) {
          triggerFadeOut(removedIds);
        }

        // Update links
        const otherLinks = prevLinks.filter(l => {
          const source = typeof l.source === 'string' ? l.source : l.source.id;
          return !source.startsWith(controllerPrefix);
        });
        const newLinks = [...otherLinks, ...prefixedIncoming.links];

        setNodes(allNodes);
        return newLinks;
      });
      return prevNodes; // This will be set by setNodes inside setLinks
    });
  }, [prefixNodeId, hasTopologyChanged, triggerFadeOut]);

  // Connect to a controller
  const connectController = useCallback(async (url: string, interval: number) => {
    // Check if already connected
    if (controllers.has(url)) {
      toast.error(`Already connected to ${url}`);
      return;
    }

    // Set status to connecting
    setControllers(prev => {
      const next = new Map(prev);
      next.set(url, {
        url,
        interval,
        status: 'connecting',
        eventSource: null,
      });
      return next;
    });

    // Health check
    try {
      await check_floodlight(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Health check failed';
      toast.error(message);

      // Set status to unreachable
      setControllers(prev => {
        const next = new Map(prev);
        next.set(url, {
          url,
          interval,
          status: 'unreachable',
          eventSource: null,
        });
        saveControllersToStorage(next);
        return next;
      });
      throw error;
    }

    // Create EventSource for streaming
    const eventSource = new EventSource(
      `/api/topology/floodlight/stream?url=${encodeURIComponent(url)}&i=${interval}`
    );

    // Handle topology events
    eventSource.addEventListener('topology', (e) => {
      try {
        const topology = JSON.parse(e.data);
        mergeTopology(url, topology);
      } catch (error) {
        console.error('[TOPOLOGY] Failed to parse topology event:', error);
      }
    });

    // Handle error events
    eventSource.addEventListener('error', (e: MessageEvent) => {
      try {
        const errorData = JSON.parse(e.data);
        toast.warning(`${url}: ${errorData.message}`);

        if (errorData.code === 'MAX_ERRORS_REACHED' || errorData.code === 'INITIAL_CONNECTION_FAILED') {
          setControllers(prev => {
            const next = new Map(prev);
            const controller = next.get(url);
            if (controller) {
              controller.status = 'error';
              next.set(url, controller);
              saveControllersToStorage(next);
            }
            return next;
          });
          eventSource.close();
        }
      } catch (error) {
        console.error('[TOPOLOGY] Failed to parse error event:', error);
      }
    });

    // Add to controllers map with 'connected' status
    setControllers(prev => {
      const next = new Map(prev);
      next.set(url, {
        url,
        interval,
        status: 'connected',
        eventSource,
      });
      saveControllersToStorage(next);
      return next;
    });

    toast.success(`Connected to ${url}`);
  }, [controllers, mergeTopology, saveControllersToStorage]);

  // Disconnect from a controller
  const disconnectController = useCallback((url: string) => {
    const controller = controllers.get(url);
    if (!controller) return;

    // Close EventSource
    controller.eventSource?.close();

    // Remove controller
    setControllers(prev => {
      const next = new Map(prev);
      next.delete(url);
      saveControllersToStorage(next);
      return next;
    });

    // Remove controller's nodes (with fade-out)
    const controllerPrefix = `${url}::`;
    const nodesToRemove = nodes.filter(n => n.id.startsWith(controllerPrefix)).map(n => n.id);
    if (nodesToRemove.length > 0) {
      triggerFadeOut(nodesToRemove);
    }

    toast.info(`Disconnected from ${url}`);
  }, [controllers, nodes, triggerFadeOut, saveControllersToStorage]);

  // Update simulation parameters
  const updateSimulationParams = useCallback((params: Partial<SimulationParams>) => {
    setSimulationParams(prev => {
      const updated = { ...prev, ...params };
      // Debounced save will happen in useEffect
      return updated;
    });
  }, []);

  // Reset simulation parameters
  const resetSimulationParams = useCallback(() => {
    setSimulationParams(DEFAULT_PARAMS);
    storage.set('simulation_params', DEFAULT_PARAMS);
  }, []);

  // Toggle node filter
  const toggleFilter = useCallback((nodeType: 'controller' | 'switch' | 'host', enabled: boolean) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        [`show${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}s` as keyof NodeFilters]: enabled,
      };
      // Save to storage
      storage.set('filters', updated);
      return updated;
    });
  }, []);

  // Retry controller connection
  const retryController = useCallback(async (url: string) => {
    const controller = controllers.get(url);
    if (!controller) return;

    // Update status to connecting
    setControllers(prev => {
      const next = new Map(prev);
      const ctrl = next.get(url);
      if (ctrl) {
        ctrl.status = 'connecting';
        next.set(url, ctrl);
      }
      return next;
    });

    try {
      await connectController(url, controller.interval);
    } catch (error) {
      // connectController already handles error toasts and status updates
      console.error(`Failed to retry ${url}:`, error);
    }
  }, [controllers, connectController]);

  // D3 Force Simulation and Rendering
  useEffect(() => {
    if (!svgRef?.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container group for zoom/pan
    const container = svg.append('g').attr('class', 'zoom-container');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('charge', d3.forceManyBody().strength(simulationParams.charge))
      .force('link', d3.forceLink<D3Node, D3Link>(links)
        .id(d => d.id)
        .distance(simulationParams.linkDistance)
      )
      .force('center', d3.forceCenter(width / 2, height / 2).strength(simulationParams.centerGravity))
      .force('collision', d3.forceCollide<D3Node>().radius(30));

    // Store simulation reference
    simulationRef.current = simulation;

    // Create links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Create node groups
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, D3Node>('g')
      .data(nodes)
      .join('g')
      .attr('id', d => `node-${d.id.replace(/:/g, '-')}`)
      .attr('class', 'node');

    // Add circles to nodes
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => {
        switch (d.type) {
          case 'controller': return '#22c55e'; // green
          case 'switch': return '#3b82f6';     // blue
          case 'host': return '#a855f7';       // purple
          default: return '#6b7280';           // gray
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .text(d => stripPrefix(d.label || d.id))
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#fff');

    // Drag behavior
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
        // Keep node fixed at dragged position
        // User can double-click to unfix (we'll add this later if needed)
      });

    node.call(drag);

    // Apply filters
    node.style('opacity', d => {
      if (d.type === 'controller' && !filters.showControllers) return 0;
      if (d.type === 'switch' && !filters.showSwitches) return 0;
      if (d.type === 'host' && !filters.showHosts) return 0;
      return removingNodes.has(d.id) ? 0.5 : 1; // Dim nodes that are fading out
    });

    // Tick function to update positions
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

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, svgRef, simulationParams, filters, removingNodes, stripPrefix]);

  // Debounced save of simulation params
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveSimulationParamsToStorage(simulationParams);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [simulationParams, saveSimulationParamsToStorage]);

  // Restore from storage on mount
  useEffect(() => {
    // Restore filters
    const savedFilters = storage.get<NodeFilters>('filters');
    if (savedFilters) {
      setFilters(savedFilters);
    }

    // Restore simulation params
    const savedParams = storage.get<SimulationParams>('simulation_params');
    if (savedParams) {
      setSimulationParams(savedParams);
    }

    // Restore and reconnect controllers
    const savedControllers = storage.get<Array<{ url: string; interval: number }>>('controllers');
    if (savedControllers && savedControllers.length > 0) {
      savedControllers.forEach(async ({ url, interval }) => {
        try {
          await connectController(url, interval);
        } catch (error) {
          // connectController already handles error toasts and unreachable status
          console.log(`Failed to restore controller ${url}:`, error);
        }
      });
    }
  }, []); // Only run on mount

  // Background retry for unreachable controllers
  useEffect(() => {
    const retryInterval = setInterval(() => {
      controllers.forEach(async (controller, url) => {
        if (controller.status === 'unreachable') {
          try {
            // Silent health check
            await check_floodlight(url);

            // If successful, reconnect
            console.log(`[RETRY] Controller ${url} is back online, reconnecting...`);
            await retryController(url);
            toast.success(`Reconnected to ${url}`);
          } catch (error) {
            // Still unreachable, continue silent retry
            console.log(`[RETRY] Controller ${url} still unreachable`);
          }
        }
      });
    }, 30000); // 30 second intervals

    return () => clearInterval(retryInterval);
  }, [controllers, retryController]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllers.forEach(controller => {
        controller.eventSource?.close();
      });
      simulationRef.current?.stop();
    };
  }, [controllers]);

  const value: TopologyViewerContextType = {
    nodes,
    links,
    controllers,
    simulationParams,
    filters,
    svgRef,
    setSvgRef: setSvgRefState,
    connectController,
    disconnectController,
    retryController,
    updateSimulationParams,
    toggleFilter,
    resetSimulationParams,
  };

  return (
    <TopologyViewerContext.Provider value={value}>
      {children}
    </TopologyViewerContext.Provider>
  );
}

export function useTopologyViewer() {
  const context = useContext(TopologyViewerContext);
  if (!context) {
    throw new Error('useTopologyViewer must be used within TopologyViewerProvider');
  }
  return context;
}
