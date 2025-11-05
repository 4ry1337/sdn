import * as d3 from 'd3';
import { NetworkNode, NetworkLink } from '@/entities/node';
import { logger } from '@/shared/lib/logger';

export interface D3SimulationNode extends NetworkNode, d3.SimulationNodeDatum {}
export interface D3SimulationLink extends NetworkLink, d3.SimulationLinkDatum<D3SimulationNode> {}

export interface GraphConfig {
  width: number;
  height: number;
  nodeRadius: number;
  linkDistance: number;
  chargeStrength: number;
  collisionRadius: number;
}

export class D3GraphRenderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g: d3.Selection<SVGGElement, unknown, null, undefined>;
  private simulation: d3.Simulation<D3SimulationNode, D3SimulationLink>;
  private config: GraphConfig;
  
  private linkGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private nodeGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private labelGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  private linkElements!: d3.Selection<SVGLineElement, D3SimulationLink, SVGGElement, unknown>;
  private nodeElements!: d3.Selection<SVGCircleElement, D3SimulationNode, SVGGElement, unknown>;
  private labelElements!: d3.Selection<SVGTextElement, D3SimulationNode, SVGGElement, unknown>;

  constructor(
    svgElement: SVGSVGElement,
    config: Partial<GraphConfig> = {}
  ) {
    this.config = {
      width: config.width || 1200,
      height: config.height || 800,
      nodeRadius: config.nodeRadius || 20,
      linkDistance: config.linkDistance || 100,
      chargeStrength: config.chargeStrength || -300,
      collisionRadius: config.collisionRadius || 40,
    };

    // Initialize SVG
    this.svg = d3.select(svgElement);
    this.svg
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .attr('viewBox', [0, 0, this.config.width, this.config.height]);

    // Create main group for pan/zoom
    this.g = this.svg.append('g');

    // Create layers (order matters for z-index)
    this.linkGroup = this.g.append('g').attr('class', 'links');
    this.nodeGroup = this.g.append('g').attr('class', 'nodes');
    this.labelGroup = this.g.append('g').attr('class', 'labels');

    // Initialize simulation
    this.simulation = d3
      .forceSimulation<D3SimulationNode, D3SimulationLink>()
      .force('link', d3.forceLink<D3SimulationNode, D3SimulationLink>()
        .id(d => d.id)
        .distance(this.config.linkDistance))
      .force('charge', d3.forceManyBody().strength(this.config.chargeStrength))
      .force('center', d3.forceCenter(this.config.width / 2, this.config.height / 2))
      .force('collision', d3.forceCollide().radius(this.config.collisionRadius));

    // Set up zoom behavior
    this.setupZoom();

    logger.debug('D3GraphRenderer initialized', {
      component: 'd3-graph-renderer',
      config: this.config,
    });
  }

  private setupZoom() {
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(zoom);
  }

  render(nodes: NetworkNode[], links: NetworkLink[]) {
    const startTime = performance.now();

    try {
      // Convert to D3 simulation format
      const simulationNodes = nodes.map(n => ({ ...n })) as D3SimulationNode[];
      const simulationLinks = links.map(l => ({ ...l })) as D3SimulationLink[];

      // Update links
      this.linkElements = this.linkGroup
        .selectAll<SVGLineElement, D3SimulationLink>('line')
        .data(simulationLinks, d => d.id)
        .join(
          enter => enter.append('line')
            .attr('class', 'link')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6)
            .attr('stroke', d => this.getLinkColor(d)),
          update => update
            .attr('stroke', d => this.getLinkColor(d))
            .attr('stroke-width', d => this.getLinkWidth(d)),
          exit => exit.remove()
        );

      // Update nodes
      this.nodeElements = this.nodeGroup
        .selectAll<SVGCircleElement, D3SimulationNode>('circle')
        .data(simulationNodes, d => d.id)
        .join(
          enter => enter.append('circle')
            .attr('class', 'node')
            .attr('r', this.config.nodeRadius)
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .call(this.setupDrag(this.simulation)),
          update => update
            .attr('fill', d => this.getNodeColor(d))
            .attr('r', d => this.getNodeRadius(d)),
          exit => exit.remove()
        );

      // Update labels
      this.labelElements = this.labelGroup
        .selectAll<SVGTextElement, D3SimulationNode>('text')
        .data(simulationNodes, d => d.id)
        .join(
          enter => enter.append('text')
            .attr('class', 'label')
            .attr('text-anchor', 'middle')
            .attr('dy', this.config.nodeRadius + 15)
            .attr('font-size', '12px')
            .attr('fill', '#333')
            .text(d => d.label),
          update => update.text(d => d.label),
          exit => exit.remove()
        );

      // Update and restart simulation
      this.simulation.nodes(simulationNodes);
      (this.simulation.force('link') as d3.ForceLink<D3SimulationNode, D3SimulationLink>)
        .links(simulationLinks);

      this.simulation.alpha(1).restart();

      // Set up tick handler
      this.simulation.on('tick', () => {
        this.linkElements
          .attr('x1', d => (d.source as D3SimulationNode).x || 0)
          .attr('y1', d => (d.source as D3SimulationNode).y || 0)
          .attr('x2', d => (d.target as D3SimulationNode).x || 0)
          .attr('y2', d => (d.target as D3SimulationNode).y || 0);

        this.nodeElements
          .attr('cx', d => d.x || 0)
          .attr('cy', d => d.y || 0);

        this.labelElements
          .attr('x', d => d.x || 0)
          .attr('y', d => d.y || 0);
      });

      const duration = performance.now() - startTime;
      logger.debug('Graph rendered', {
        component: 'd3-graph-renderer',
        nodeCount: nodes.length,
        linkCount: links.length,
        duration,
      });
    } catch (error) {
      logger.error('Failed to render graph', {
        component: 'd3-graph-renderer',
      }, error as Error);
    }
  }

  private setupDrag(simulation: d3.Simulation<D3SimulationNode, D3SimulationLink>) {
    function dragStarted(event: d3.D3DragEvent<SVGCircleElement, D3SimulationNode, D3SimulationNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, D3SimulationNode, D3SimulationNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragEnded(event: d3.D3DragEvent<SVGCircleElement, D3SimulationNode, D3SimulationNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag<SVGCircleElement, D3SimulationNode>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded);
  }

  private getNodeColor(node: D3SimulationNode): string {
    switch (node.type) {
      case 'switch':
        return node.status === 'active' ? '#3b82f6' : '#94a3b8'; // Blue or gray
      case 'host':
        return node.status === 'active' ? '#8b5cf6' : '#c4b5fd'; // Purple or light purple
      case 'controller':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
  }

  private getNodeRadius(node: D3SimulationNode): number {
    // Make switches slightly larger
    return node.type === 'switch' ? this.config.nodeRadius + 5 : this.config.nodeRadius;
  }

  private getLinkColor(link: D3SimulationLink): string {
    const utilization = link.utilization || 0;
    
    if (utilization > 80) return '#ef4444'; // Red - high utilization
    if (utilization > 50) return '#f59e0b'; // Orange - medium utilization
    if (utilization > 20) return '#fbbf24'; // Yellow - low-medium utilization
    return '#4ade80'; // Green - low utilization
  }

  private getLinkWidth(link: D3SimulationLink): number {
    const utilization = link.utilization || 0;
    // Width between 2 and 8 based on utilization
    return Math.max(2, Math.min(8, utilization / 12.5));
  }

  destroy() {
    this.simulation.stop();
    this.svg.selectAll('*').remove();
    logger.debug('D3GraphRenderer destroyed', {
      component: 'd3-graph-renderer',
    });
  }

  // Public methods for interaction
  resetZoom() {
    this.svg.transition().duration(750).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  }

  centerGraph() {
    const bounds = this.g.node()?.getBBox();
    if (!bounds) return;

    const fullWidth = this.config.width;
    const fullHeight = this.config.height;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    const scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    this.svg.transition().duration(750).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
  }
}
