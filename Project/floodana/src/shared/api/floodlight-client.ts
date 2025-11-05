import { config } from '@/shared/config';
import { ApiError, ControllerUnreachableError, TimeoutError } from './errors';
import { logger } from '@/shared/lib/logger';

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
}

class FloodlightClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor() {
    this.baseUrl = config.floodlight.baseUrl;
    this.defaultTimeout = config.floodlight.timeout;
    this.defaultRetries = config.floodlight.retryAttempts;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(url);
      }
      throw error;
    }
  }

  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries: number,
    delay: number,
    endpoint: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }

      logger.warn(`Request failed, retrying... (${retries} attempts left)`, {
        component: 'floodlight-client',
        endpoint,
        retriesLeft: retries,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryRequest(fn, retries - 1, delay * 2, endpoint);
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      method = 'GET',
      body,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();

    try {
      const response = await this.retryRequest(
        async () => {
          const res = await this.fetchWithTimeout(
            url,
            {
              method,
              headers: {
                'Content-Type': 'application/json',
              },
              body: body ? JSON.stringify(body) : undefined,
            },
            timeout
          );

          if (!res.ok) {
            const errorText = await res.text().catch(() => 'Unknown error');
            throw new ApiError(
              `HTTP ${res.status}: ${errorText}`,
              res.status,
              endpoint
            );
          }

          return res;
        },
        retries,
        config.floodlight.retryDelay,
        endpoint
      );

      const duration = performance.now() - startTime;
      logger.logApiRequest(endpoint, duration, true);

      const data = await response.json();
      return data as T;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.logApiRequest(endpoint, duration, false);

      if (error instanceof TimeoutError || error instanceof ApiError) {
        logger.error(`Request failed`, {
          component: 'floodlight-client',
          endpoint,
          duration,
        }, error as Error);
        throw error;
      }

      logger.error(`Unexpected error`, {
        component: 'floodlight-client',
        endpoint,
        duration,
      }, error as Error);

      throw new ControllerUnreachableError(endpoint);
    }
  }

  // Topology endpoints
  async getSwitches() {
    return this.request('/wm/core/controller/switches/json');
  }

  async getLinks() {
    return this.request('/wm/topology/links/json');
  }

  async getDevices() {
    return this.request('/wm/device/');
  }

  // Statistics endpoints
  async getBandwidthStats(dpid: string, port: string) {
    return this.request(`/wm/statistics/bandwidth/${dpid}/${port}/json`);
  }

  async getPortStats(dpid: string) {
    return this.request(`/wm/core/switch/${dpid}/port/json`);
  }

  async getFlows(dpid: string) {
    return this.request(`/wm/core/switch/${dpid}/flow/json`);
  }

  // Flow management
  async addFlow(flow: unknown) {
    return this.request('/wm/staticflowpusher/json', {
      method: 'POST',
      body: flow,
    });
  }

  async deleteFlow(flowName: string) {
    return this.request('/wm/staticflowpusher/json', {
      method: 'DELETE',
      body: { name: flowName },
    });
  }
}

export const floodlightClient = new FloodlightClient();
