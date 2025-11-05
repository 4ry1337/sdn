'use client';

import { useEffect, useRef, useState } from 'react';
import { D3GraphRenderer } from '../lib/d3-graph-renderer';
import { NetworkNode } from '@/entities/node';
import { NetworkLink } from '@/entities/link';

interface UseD3GraphProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  width?: number;
  height?: number;
}

export function useD3Graph({ nodes, links, width = 1200, height = 800 }: UseD3GraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rendererRef = useRef<D3GraphRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize renderer
  useEffect(() => {
    if (!svgRef.current) return;

    const renderer = new D3GraphRenderer(svgRef.current, { width, height });
    rendererRef.current = renderer;
    setIsReady(true);

    return () => {
      renderer.destroy();
      rendererRef.current = null;
      setIsReady(false);
    };
  }, [width, height]);

  // Update graph when data changes
  useEffect(() => {
    if (!isReady || !rendererRef.current) return;

    rendererRef.current.render(nodes, links);
  }, [nodes, links, isReady]);

  const resetZoom = () => {
    rendererRef.current?.resetZoom();
  };

  const centerGraph = () => {
    rendererRef.current?.centerGraph();
  };

  return {
    svgRef,
    isReady,
    resetZoom,
    centerGraph,
  };
}
