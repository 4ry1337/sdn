export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ControllerUnreachableError extends ApiError {
  constructor(endpoint?: string) {
    super('Floodlight controller is unreachable', 503, endpoint);
    this.name = 'ControllerUnreachableError';
  }
}

export class TimeoutError extends ApiError {
  constructor(endpoint?: string) {
    super('Request timeout', 408, endpoint);
    this.name = 'TimeoutError';
  }
}
