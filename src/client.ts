/**
 * Application Distribution System API Client
 */

import {
  ApiResponse,
  ApplicationInfo,
  ApplicationStats,
  CustomerInfo,
  DownloadInfo,
  ListApplicationsOptions,
  ListApplicationsResponse,
  ListVersionsResponse,
  ListVersionsOptions,
  ListVersionFilesResponse,
  CreateShareLinkOptions,
  ShareLinkInfo,
  ListCustomersResponse,
  ListActivityOptions,
  ListActivityResponse,
  VersionInfo,
  UpdateVersionOptions,
  CreateApplicationOptions,
  CreateApplicationResponse,
  UpdateApplicationCustomersOptions,
  UpdateApplicationCustomersResponse,
  GetDownloadInfoOptions,
} from './types';

export interface BinDistClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export class BinDistClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: BinDistClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * Update the API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Update the base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Make an authenticated request to the API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      const text = await response.text();
      clearTimeout(timeoutId);

      if (!response.ok) {
        return errorResponse<T>(response.status, response.statusText, text);
      }

      return JSON.parse(text) as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Build query string from options object
   */
  private buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * List all applications accessible to the authenticated customer
   */
  async listApplications(
    options: ListApplicationsOptions = {}
  ): Promise<ApiResponse<ListApplicationsResponse>> {
    // The API reads the page-size parameter as `limit`; `pageSize` is ignored.
    const { pageSize, ...rest } = options;
    const queryString = this.buildQueryString({
      ...rest,
      ...(pageSize === undefined ? {} : { limit: pageSize }),
    } as Record<string, unknown>);
    return this.request<ListApplicationsResponse>(
      `/v1/applications${queryString}`
    );
  }

  /**
   * Get details for a specific application
   */
  async getApplication(
    applicationId: string
  ): Promise<ApiResponse<ApplicationInfo>> {
    return this.request<ApplicationInfo>(
      `/v1/applications/${encodeURIComponent(applicationId)}`
    );
  }

  /**
   * Delete an application (soft delete, admin only)
   * The application and its data remain in the database but are hidden from listings.
   */
  async deleteApplication(
    applicationId: string
  ): Promise<ApiResponse<{ message: string; applicationId: string; deletedAt: string }>> {
    return this.request<{ message: string; applicationId: string; deletedAt: string }>(
      `/v1/management/applications/${encodeURIComponent(applicationId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Create a new application (admin only)
   */
  async createApplication(
    options: CreateApplicationOptions
  ): Promise<ApiResponse<CreateApplicationResponse>> {
    return this.request<CreateApplicationResponse>('/v1/management/applications', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Update customer access for an application (admin only)
   */
  async updateApplicationCustomers(
    applicationId: string,
    options: UpdateApplicationCustomersOptions
  ): Promise<ApiResponse<UpdateApplicationCustomersResponse>> {
    return this.request<UpdateApplicationCustomersResponse>(
      `/v1/management/applications/${encodeURIComponent(applicationId)}/customers`,
      {
        method: 'PUT',
        body: JSON.stringify(options),
      }
    );
  }

  /**
   * List all versions for a specific application
   * @param applicationId The application ID
   * @param options Optional settings including channel for accessing disabled versions
   */
  async listVersions(
    applicationId: string,
    options: ListVersionsOptions = {}
  ): Promise<ApiResponse<ListVersionsResponse>> {
    const headers: Record<string, string> = {};
    if (options.channel) {
      headers['X-Channel'] = options.channel;
    }
    return this.request<ListVersionsResponse>(
      `/v1/applications/${encodeURIComponent(applicationId)}/versions`,
      { headers }
    );
  }

  /**
   * Update a version's metadata (admin only)
   */
  async updateVersion(
    applicationId: string,
    version: string,
    updates: UpdateVersionOptions
  ): Promise<ApiResponse<VersionInfo>> {
    return this.request<VersionInfo>(
      `/v1/applications/${encodeURIComponent(applicationId)}/versions/${encodeURIComponent(version)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  }

  /**
   * List all files for a specific version
   */
  async listVersionFiles(
    applicationId: string,
    version: string
  ): Promise<ApiResponse<ListVersionFilesResponse>> {
    return this.request<ListVersionFilesResponse>(
      `/v1/applications/${encodeURIComponent(applicationId)}/versions/${encodeURIComponent(version)}/files`
    );
  }

  /**
   * Get download statistics for an application
   */
  async getApplicationStats(
    applicationId: string,
    version?: string
  ): Promise<ApiResponse<ApplicationStats>> {
    const queryString = version ? `?version=${encodeURIComponent(version)}` : '';
    return this.request<ApplicationStats>(
      `/v1/applications/${encodeURIComponent(applicationId)}/stats${queryString}`
    );
  }

  /**
   * Get download URL and information for a file
   * @param applicationId The application ID
   * @param version The version string
   * @param fileId Optional file ID (defaults to main file)
   * @param options Optional settings including channel for accessing disabled versions
   */
  async getDownloadInfo(
    applicationId: string,
    version: string,
    fileId?: string,
    options: GetDownloadInfoOptions = {}
  ): Promise<ApiResponse<DownloadInfo>> {
    const params: Record<string, string> = {
      applicationId,
      version,
    };

    if (fileId) {
      params.fileId = fileId;
    }

    const headers: Record<string, string> = {};
    if (options.channel) {
      headers['X-Channel'] = options.channel;
    }

    const queryString = this.buildQueryString(params);
    return this.request<DownloadInfo>(`/v1/downloads/url${queryString}`, { headers });
  }

  /**
   * Download a file from a URL (Node.js environment)
   * Returns the file content as an ArrayBuffer
   */
  async downloadFile(downloadUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Download a file and return a readable stream (Node.js environment)
   */
  async downloadFileStream(
    downloadUrl: string
  ): Promise<ReadableStream<Uint8Array> | null> {
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return response.body;
  }

  /**
   * Create a shareable download link
   */
  async createShareLink(
    options: CreateShareLinkOptions
  ): Promise<ApiResponse<ShareLinkInfo>> {
    const body: Record<string, unknown> = {
      applicationId: options.applicationId,
      version: options.version,
      expiresInMinutes: options.expiresInMinutes ?? 30,
    };

    if (options.fileId) {
      body.fileId = options.fileId;
    }

    return this.request<ShareLinkInfo>('/v1/downloads/share', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * List all customers (admin only)
   */
  async listCustomers(): Promise<ApiResponse<ListCustomersResponse>> {
    return this.request<ListCustomersResponse>('/v1/management/customers');
  }

  /**
   * Update a customer (admin only)
   */
  async updateCustomer(
    customerId: string,
    updates: {
      isActive?: boolean;
      name?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<CustomerInfo>> {
    return this.request<CustomerInfo>(
      `/v1/management/customers/${encodeURIComponent(customerId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  }

  /**
   * Regenerate a customer's API key (admin only)
   */
  async regenerateCustomerKey(
    customerId: string
  ): Promise<ApiResponse<{ customerId: string; apiKey: string; apiSecret: string; regeneratedAt: string }>> {
    return this.request<{ customerId: string; apiKey: string; apiSecret: string; regeneratedAt: string }>(
      `/v1/management/customers/${encodeURIComponent(customerId)}/regenerate-key`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * List activity (uploads and downloads) (admin only)
   */
  async listActivity(
    options: ListActivityOptions = {}
  ): Promise<ApiResponse<ListActivityResponse>> {
    const queryString = this.buildQueryString(options as Record<string, unknown>);
    return this.request<ListActivityResponse>(`/v1/activity${queryString}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Build the response for a non-2xx status. Uses the API's error envelope when
 * the body has one; otherwise (auth middleware, rate limiter, gateway HTML
 * page, empty body) synthesizes an error from the HTTP status. Either way the
 * status is kept in `error.httpStatus`.
 */
function errorResponse<T>(
  status: number,
  statusText: string,
  text: string
): ApiResponse<T> {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }

  if (isRecord(body) && isRecord(body.error) && typeof body.error.code === 'string') {
    const envelope = body as unknown as ApiResponse<T>;
    return {
      success: false,
      error: { ...envelope.error!, httpStatus: status },
      meta: envelope.meta,
    };
  }

  let message = '';
  if (isRecord(body)) {
    // Bare {"message": "..."} or {"error": "..."} bodies
    if (typeof body.message === 'string') {
      message = body.message;
    } else if (typeof body.error === 'string') {
      message = body.error;
    }
  }

  return {
    success: false,
    error: {
      code: codeForStatus(status),
      message: message || statusText || `HTTP ${status}`,
      httpStatus: status,
    },
  };
}

/**
 * Stable lower-case error code for an HTTP status, matching the other BinDist clients.
 */
function codeForStatus(status: number): string {
  if (status === 400) return 'bad_request';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'http_error';
}

/**
 * Create a new BinDist client instance
 */
export function createBinDistClient(config: BinDistClientConfig): BinDistClient {
  return new BinDistClient(config);
}
