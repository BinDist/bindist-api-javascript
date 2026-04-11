# BinDist JavaScript/TypeScript API Client

JavaScript/TypeScript client library for the Application Distribution System API.

## Requirements

- Node.js 18+ (uses native fetch)
- TypeScript 5+ (for TypeScript projects)

## Installation

### From npm (when published)

```bash
npm install @bindist/client
```

### From source

```bash
cd api/javascript
npm install
npm run build
```

## Usage

### Basic Example (TypeScript)

```typescript
import { createBinDistClient } from '@bindist/client';

const client = createBinDistClient({
  baseUrl: 'https://api.bindist.com',
  apiKey: 'your-api-key',
});

// List applications
const apps = await client.listApplications();
if (apps.success && apps.data) {
  for (const app of apps.data.applications) {
    console.log(`${app.name} (${app.applicationId})`);
  }
} else {
  console.error('Error:', apps.error?.message);
}
```

### Basic Example (JavaScript)

```javascript
const { createBinDistClient } = require('@bindist/client');

const client = createBinDistClient({
  baseUrl: 'https://api.bindist.com',
  apiKey: 'your-api-key',
});

// List applications
const apps = await client.listApplications();
if (apps.success) {
  apps.data.applications.forEach((app) => {
    console.log(`${app.name} (${app.applicationId})`);
  });
}
```

### List Applications with Options

```typescript
import { createBinDistClient, ListApplicationsOptions } from '@bindist/client';

const client = createBinDistClient({
  baseUrl: 'https://api.bindist.com',
  apiKey: 'your-api-key',
});

const options: ListApplicationsOptions = {
  page: 1,
  pageSize: 10,
  search: 'myapp',
  tags: 'windows,desktop',
  sortBy: 'name',
  sortOrder: 'asc',
};

const apps = await client.listApplications(options);
if (apps.success && apps.data && apps.meta?.pagination) {
  console.log(`Found ${apps.data.applications.length} of ${apps.meta.pagination.total} applications`);
}
```

### Get Application Details

```typescript
const app = await client.getApplication('myapp');
if (app.success && app.data) {
  console.log('Name:', app.data.name);
  console.log('Description:', app.data.description);
  console.log('Active:', app.data.isActive);
}
```

### List Versions

```typescript
const versions = await client.listVersions('myapp');
if (versions.success && versions.data) {
  for (const ver of versions.data.versions) {
    console.log(`${ver.version} - ${ver.fileSize} bytes`);
  }
}

// Include disabled versions by selecting the Test channel
const testVersions = await client.listVersions('myapp', { channel: 'Test' });
```

### List Version Files

```typescript
const files = await client.listVersionFiles('myapp', '1.0.0');
if (files.success && files.data) {
  for (const file of files.data.files) {
    console.log(`${file.fileName} (${file.fileType}) - ${file.fileSize} bytes`);
  }
}
```

### Download File

```typescript
import { writeFileSync } from 'fs';

// Get download URL
const downloadInfo = await client.getDownloadInfo('myapp', '1.0.0');
// To download a disabled version, pass a channel:
// const downloadInfo = await client.getDownloadInfo('myapp', '1.0.0', undefined, { channel: 'Test' });
if (downloadInfo.success && downloadInfo.data) {
  console.log('File:', downloadInfo.data.fileName);
  console.log('Size:', downloadInfo.data.fileSize, 'bytes');
  console.log('Checksum:', downloadInfo.data.checksum);

  // Download the file
  const content = await client.downloadFile(downloadInfo.data.url);
  writeFileSync(downloadInfo.data.fileName, Buffer.from(content));
  console.log('Download complete!');
}
```

### Download to Stream

```typescript
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const downloadInfo = await client.getDownloadInfo('myapp', '1.0.0');
if (downloadInfo.success && downloadInfo.data) {
  const stream = await client.downloadFileStream(downloadInfo.data.url);
  if (stream) {
    const fileStream = createWriteStream(downloadInfo.data.fileName);
    Readable.fromWeb(stream).pipe(fileStream);
  }
}
```

### Download Specific File (Multi-file Versions)

```typescript
// Get list of files
const files = await client.listVersionFiles('myapp', '1.0.0');
if (files.success && files.data) {
  for (const file of files.data.files) {
    // Download each file
    const downloadInfo = await client.getDownloadInfo('myapp', '1.0.0', file.fileId);
    if (downloadInfo.success && downloadInfo.data) {
      const content = await client.downloadFile(downloadInfo.data.url);
      writeFileSync(file.fileName, Buffer.from(content));
    }
  }
}
```

### Update Client Credentials

```typescript
client.setApiKey('new-api-key');
client.setBaseUrl('https://api.example.com');
```

### Application Stats

```typescript
const stats = await client.getApplicationStats('myapp');
// Optionally scope to a single version:
const versionStats = await client.getApplicationStats('myapp', '1.0.0');
```

### Create Share Link

```typescript
const link = await client.createShareLink({
  applicationId: 'myapp',
  version: '1.0.0',
  fileId: 'optional-file-id',
  expiresInMinutes: 30,
});
if (link.success && link.data) {
  console.log('Share URL:', link.data.shareUrl);
}
```

## Admin Methods

These methods require an API key with admin/management privileges.

### Manage Applications

```typescript
// Create
await client.createApplication({
  applicationId: 'myapp',
  name: 'My App',
  description: 'Desktop client',
  tags: ['windows'],
  customerIds: ['customer-1'],
});

// Update customer access
await client.updateApplicationCustomers('myapp', {
  addCustomerIds: ['customer-2'],
  removeCustomerIds: ['customer-1'],
});

// Soft delete
await client.deleteApplication('myapp');
```

### Update a Version

```typescript
await client.updateVersion('myapp', '1.0.0', {
  releaseNotes: 'Bug fixes',
  isActive: true,
  isEnabled: true,
  minimumClientVersion: '0.9.0',
  totpCode: '123456',
});
```

### Manage Customers

```typescript
const customers = await client.listCustomers();

await client.updateCustomer('customer-1', {
  isActive: false,
  name: 'Renamed Customer',
  notes: 'Deactivated on request',
});

const regen = await client.regenerateCustomerKey('customer-1');
if (regen.success && regen.data) {
  console.log('New API key:', regen.data.apiKey);
}
```

### List Activity

```typescript
const activity = await client.listActivity({
  type: 'all',
  limit: 100,
  customerId: 'customer-1',
  startDate: '2026-01-01',
  endDate: '2026-04-01',
});
```

## Type Reference

### ApplicationInfo

```typescript
interface ApplicationInfo {
  applicationId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
```

### VersionInfo

```typescript
interface VersionInfo {
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
```

### VersionFile

```typescript
interface VersionFile {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  checksum: string;
  order: number;
  description?: string;
}
```

### DownloadInfo

```typescript
interface DownloadInfo {
  downloadId: string;
  url: string;
  expiresAt: string;
  fileName: string;
  fileSize: number;
  checksum: string;
}
```

### ApiResponse<T>

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}
```

### ApiError

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}
```

### Pagination

```typescript
interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### ListApplicationsOptions

```typescript
interface ListApplicationsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  tags?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
```

## Error Handling

All API methods return an `ApiResponse<T>` object. Check the `success` field to determine if the operation succeeded:

```typescript
const response = await client.listApplications();

if (response.success && response.data) {
  // Process response.data
} else {
  // Handle error
  console.error('Error Code:', response.error?.code);
  console.error('Error Message:', response.error?.message);
}
```

For download operations, errors are thrown as exceptions:

```typescript
try {
  const content = await client.downloadFile(url);
} catch (error) {
  console.error('Download failed:', error.message);
}
```

## Configuration Options

```typescript
interface BinDistClientConfig {
  baseUrl: string;    // API base URL (required)
  apiKey: string;     // API key for authentication (required)
  timeout?: number;   // Request timeout in milliseconds (default: 30000)
}
```

## Browser Support

This client uses the native `fetch` API and should work in modern browsers. For older browsers, you may need to polyfill `fetch`.

```html
<script src="https://unpkg.com/@bindist/client/dist/index.js"></script>
<script>
  const client = BinDist.createBinDistClient({
    baseUrl: 'https://api.bindist.com',
    apiKey: 'your-api-key',
  });

  client.listApplications().then((apps) => {
    if (apps.success) {
      console.log(apps.data.applications);
    }
  });
</script>
```
