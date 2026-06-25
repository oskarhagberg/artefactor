// A payload stored outside the aggregate (filesystem in production).
export interface StoredPayload {
  ref: string;
  bytes: number;
  hash: string;
}

// Port: persistence for trusted HTML payloads. Implemented in infra/storage.
export interface PayloadStore {
  put(content: Uint8Array): Promise<StoredPayload>;
  get(ref: string): Promise<Uint8Array>;
  delete(ref: string): Promise<void>;
}
