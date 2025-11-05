'use client';

import { useEffect, useState, useCallback } from 'react';
import { floodlightClient, fetchAndMergeTopology, TopologyData } from '@/shared/api';
import { logger } from '@/shared/lib/logger';
import { config } from '@/shared/config';

export function useTopology() {
  const [topology, setTopology] = useState<TopologyData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTopology = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchAndMergeTopology(floodlightClient);
      
      setTopology(data);
      setLastUpdate(new Date());

      logger.info('Topology fetched successfully', {
        component: 'use-topology',
        nodeCount: data.nodes.length,
        linkCount: data.links.length,
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      logger.error('Failed to fetch topology', {
        component: 'use-topology',
      }, error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTopology();
    }, config.polling.topologyInterval);

    return () => clearInterval(interval);
  }, [fetchTopology]);

  return {
    topology,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchTopology,
  };
}
