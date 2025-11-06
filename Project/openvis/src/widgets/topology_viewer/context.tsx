"use client"

import * as d3 from 'd3';
import type { Node, Link } from '@/features/topology/read/types';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface SimulationNode extends d3.SimulationNodeDatum, Node {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimulationLink extends Link {
  source: string;
  target: string;
}

interface GraphContextValue {
  svgRef: React.RefObject<SVGSVGElement | null>;
  simulation: d3.Simulation<SimulationNode, SimulationLink> | null;
  nodes: SimulationNode[];
  links: SimulationLink[];
  setNodes: (nodes: Node[]) => void;
  setLinks: (links: Link[]) => void;
  updateSimulation: () => void;
  restartSimulation: () => void;
  forceStrength: {
    value: number;
    set: (strength: number) => void;
  },
  linkDistance: {
    value: number;
    set: (distance: number) => void;
  },
  chargeStrength: {
    value: number;
    set: (strength: number) => void;
  }
}

const GraphContext = createContext<GraphContextValue | null>(null);

export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
}

interface GraphProviderProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
}

export function GraphProvider({ children, width = 800, height = 600 }: GraphProviderProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [simulation, setSimulation] = useState<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const [nodes, setNodesState] = useState<SimulationNode[]>([]);
  const [links, setLinksState] = useState<SimulationLink[]>([]);
  const [forceStrength, setForceStrengthState] = useState(0.5);
  const [linkDistance, setLinkDistanceState] = useState(100);
  const [chargeStrength, setChargeStrengthState] = useState(-300);

  const setNodes = useCallback((newNodes: Node[]) => {
    setNodesState(newNodes as SimulationNode[]);
  }, []);

  const setLinks = useCallback((newLinks: Link[]) => {
    setLinksState(newLinks as SimulationLink[]);
  }, []);

  const updateSimulation = useCallback(() => {
    if (!simulation) {
      const newSimulation = d3.forceSimulation<SimulationNode, SimulationLink>(nodes)
        .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
          .id((d) => d.id)
          .distance(linkDistance))
        .force('charge', d3.forceManyBody().strength(chargeStrength))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30))
        .force('x', d3.forceX(width / 2).strength(forceStrength))
        .force('y', d3.forceY(height / 2).strength(forceStrength));

      setSimulation(newSimulation);
    } else {
      simulation
        .nodes(nodes)
        .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
          .id((d) => d.id)
          .distance(linkDistance))
        .force('charge', d3.forceManyBody().strength(chargeStrength))
        .force('x', d3.forceX(width / 2).strength(forceStrength))
        .force('y', d3.forceY(height / 2).strength(forceStrength));

      simulation.alpha(1).restart();
    }
  }, [simulation, nodes, links, width, height, forceStrength, linkDistance, chargeStrength]);

  const restartSimulation = useCallback(() => {
    if (simulation) {
      simulation.alpha(1).restart();
    }
  }, [simulation]);

  const setForceStrength = useCallback((strength: number) => {
    setForceStrengthState(strength);
    if (simulation) {
      simulation.force('x', d3.forceX(width / 2).strength(strength));
      simulation.force('y', d3.forceY(height / 2).strength(strength));
      simulation.alpha(1).restart();
    }
  }, [simulation, width, height]);

  const setLinkDistance = useCallback((distance: number) => {
    setLinkDistanceState(distance);
    if (simulation) {
      simulation.force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
        .id((d) => d.id)
        .distance(distance));
      simulation.alpha(1).restart();
    }
  }, [simulation, links]);

  const setChargeStrength = useCallback((strength: number) => {
    setChargeStrengthState(strength);
    if (simulation) {
      simulation.force('charge', d3.forceManyBody().strength(strength));
      simulation.alpha(1).restart();
    }
  }, [simulation]);

  const value: GraphContextValue = {
    svgRef,
    simulation,
    nodes,
    links,
    setNodes,
    setLinks,
    updateSimulation,
    restartSimulation,
    forceStrength: {
      value: forceStrength,
      set: setForceStrength
    },
    linkDistance: {
      value: linkDistance,
      set: setLinkDistance,
    },
    chargeStrength: {
      value: chargeStrength,
      set: setChargeStrength,
    }
  };

  return (
    <GraphContext.Provider value={value}>
      {children}
    </GraphContext.Provider>
  );
}
