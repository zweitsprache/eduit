// Published Dazit assets (worksheets/, library/) live in exactly one Vercel Blob
// store that the editor writes to and Dazit reads from. That store is addressed
// through its own env var instead of the ambient BLOB_READ_WRITE_TOKEN, because
// Vercel injects BLOB_READ_WRITE_TOKEN for whichever store happens to be
// connected to a project — which silently pointed the two apps at different
// stores and served stale thumbnails.
const TOKEN_STORE_ID = /^vercel_blob_rw_([A-Za-z0-9]+)_/;

export function dazitBlobToken(): string | null {
  const token = process.env.DAZIT_BLOB_READ_WRITE_TOKEN;
  const expectedStoreId = process.env.DAZIT_BLOB_STORE_ID;
  if (!token) {
    console.error('DAZIT_BLOB_READ_WRITE_TOKEN is not set.');
    return null;
  }
  if (!expectedStoreId) {
    console.error('DAZIT_BLOB_STORE_ID is not set.');
    return null;
  }
  const storeId = token.match(TOKEN_STORE_ID)?.[1];
  if (!storeId) {
    console.error('DAZIT_BLOB_READ_WRITE_TOKEN is not a Vercel Blob read-write token.');
    return null;
  }
  if (`store_${storeId}` !== expectedStoreId) {
    console.error(
      `DAZIT_BLOB_READ_WRITE_TOKEN points at store_${storeId} but DAZIT_BLOB_STORE_ID is ${expectedStoreId}.`,
    );
    return null;
  }
  return token;
}
