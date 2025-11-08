import axios, { AxiosError } from "axios";

export async function check_floodlight(url: string): Promise<boolean> {
  try {
    const response = await axios.get(`${url}/wm/core/health/json`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
      },
    });

    // Validate response structure
    if (typeof response.data === 'object' && response.data !== null && 'healthy' in response.data) {
      return response.data.healthy === true;
    }

    // If response doesn't have 'healthy' field, but status is 200, assume healthy
    return true;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Timeout
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error(`Health check timed out after 5s for ${url}`);
      }

      // Network error
      if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
        throw new Error(`Cannot connect to Floodlight at ${url}`);
      }

      // HTTP errors
      if (axiosError.response) {
        const status = axiosError.response.status;
        throw new Error(`Health check failed with status ${status}: ${axiosError.response.statusText}`);
      }
    }

    // Re-throw non-axios errors
    throw error;
  }
}
