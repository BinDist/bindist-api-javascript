/**
 * Application Distribution System API - Type Definitions
 */

/**
 * Represents an error returned by the API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Represents pagination information
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  requestId: string;
  version?: string;
  pagination?: Pagination;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * Represents an application
 */
export interface ApplicationInfo {
  applicationId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

/**
 * Represents version information for an application
 */
export interface VersionInfo {
  versionId: string;
  applicationId: string;
  version: string;
  releaseNotes?: string;
  isActive: boolean;
  /** Whether the version is enabled for production downloads */
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  fileSize: number;
  downloadCount: number;
  minimumClientVersion?: string;
}

/**
 * Options for listing versions
 */
export interface ListVersionsOptions {
  /** Channel for filtering versions. Use "Test" to include disabled versions. */
  channel?: string;
}

/**
 * Options for getting download info
 */
export interface GetDownloadInfoOptions {
  /** Channel for accessing disabled versions. Use "Test" to download disabled versions. */
  channel?: string;
}

/**
 * Options for updating a version
 */
export interface UpdateVersionOptions {
  releaseNotes?: string | null;
  isActive?: boolean;
  isEnabled?: boolean;
  minimumClientVersion?: string;
  totpCode?: string;
}

/**
 * Represents a file within a version
 */
export interface VersionFile {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  checksum: string;
  order: number;
  description?: string;
}

/**
 * Represents download information for a file
 */
export interface DownloadInfo {
  downloadId: string;
  url: string;
  expiresAt: string;
  fileName: string;
  fileSize: number;
  checksum: string;
}

/**
 * Options for listing applications
 */
export interface ListApplicationsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  tags?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Options for creating an application (admin only)
 */
export interface CreateApplicationOptions {
  applicationId: string;
  name: string;
  description?: string;
  tags?: string[];
  customerIds?: string[];
}

/**
 * Response for create application endpoint
 */
export interface CreateApplicationResponse {
  applicationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  customerIds: string[];
}

/**
 * Options for updating application customers (admin only)
 */
export interface UpdateApplicationCustomersOptions {
  addCustomerIds?: string[];
  removeCustomerIds?: string[];
}

/**
 * Response for update application customers endpoint
 */
export interface UpdateApplicationCustomersResponse {
  applicationId: string;
  customerIds: string[];
  added: string[];
  removed: string[];
}

/**
 * Response for list applications endpoint
 */
export interface ListApplicationsResponse {
  applications: ApplicationInfo[];
}

/**
 * Response for list versions endpoint
 */
export interface ListVersionsResponse {
  versions: VersionInfo[];
}

/**
 * Response for list version files endpoint
 */
export interface ListVersionFilesResponse {
  applicationId: string;
  version: string;
  files: VersionFile[];
}

/**
 * Download statistics for an application
 */
export interface ApplicationStats {
  applicationId: string;
  version?: string;
  totalDownloads: number;
  uniqueCustomers: number;
  downloadsByVersion: Record<string, number>;
  downloadsByDate: Record<string, number>;
  recentDownloads: Array<{
    downloadedAt: string;
    version: string;
    customerId: string;
  }>;
}

/**
 * Options for creating a share link
 */
export interface CreateShareLinkOptions {
  applicationId: string;
  version: string;
  fileId?: string;
  expiresInMinutes?: number;
}

/**
 * Response for create share link endpoint
 */
export interface ShareLinkInfo {
  shareUrl: string;
  token: string;
  expiresAt: string;
  expiresInMinutes: number;
}

/**
 * Represents a customer (admin only)
 */
export interface CustomerInfo {
  customerId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  notes?: string;
}

/**
 * Response for list customers endpoint (admin only)
 */
export interface ListCustomersResponse {
  customers: CustomerInfo[];
}

/**
 * Represents an activity item (upload or download)
 */
export interface ActivityItem {
  type: 'upload' | 'download';
  id: string;
  applicationId: string;
  applicationName?: string;
  version: string;
  fileName?: string;
  fileSize?: number;
  customerId: string;
  customerName?: string;
  clientIp: string;
  timestamp: string;
  userAgent?: string;
  // Upload-specific fields
  uploadMethod?: 'direct' | 'large';
  ipChanged?: boolean;
  previousIp?: string;
  // Download-specific fields
  downloadSource?: 'api' | 'share';
  shareToken?: string;
}

/**
 * Options for listing activity
 */
export interface ListActivityOptions {
  type?: 'uploads' | 'downloads' | 'all';
  limit?: number;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Response for list activity endpoint (admin only)
 */
export interface ListActivityResponse {
  activities: ActivityItem[];
  count: number;
  filters: {
    type: string;
    limit: number;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  };
}
