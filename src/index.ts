/**
 * Application Distribution System API Client
 *
 * @packageDocumentation
 */

export { BinDistClient, createBinDistClient } from './client';
export type { BinDistClientConfig } from './client';
export type {
  ActivityItem,
  ApiError,
  ApiResponse,
  ApplicationInfo,
  ApplicationStats,
  CreateApplicationOptions,
  CreateApplicationResponse,
  CreateShareLinkOptions,
  CustomerInfo,
  DownloadInfo,
  ListActivityOptions,
  ListActivityResponse,
  ListApplicationsOptions,
  ListApplicationsResponse,
  ListCustomersResponse,
  ListVersionFilesResponse,
  ListVersionsOptions,
  ListVersionsResponse,
  Pagination,
  ResponseMeta,
  ShareLinkInfo,
  UpdateApplicationCustomersOptions,
  UpdateApplicationCustomersResponse,
  UpdateVersionOptions,
  VersionFile,
  VersionInfo,
} from './types';
