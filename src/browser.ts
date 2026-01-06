/**
 * Browser entry point - exports BinDistClient to window
 */

import { BinDistClient, createBinDistClient } from './client';

// Export to window for browser usage
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).BinDistClient = BinDistClient;
  (window as unknown as Record<string, unknown>).createBinDistClient = createBinDistClient;
}

export { BinDistClient, createBinDistClient };
