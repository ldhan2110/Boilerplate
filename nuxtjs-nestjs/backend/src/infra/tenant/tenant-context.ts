import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantStore {
  tenantId: string;
}

const storage = new AsyncLocalStorage<TenantStore>();

export const TenantContext = {
  run<T>(tenantId: string, callback: () => T): T {
    return storage.run({ tenantId }, callback);
  },

  getTenantId(): string | null {
    return storage.getStore()?.tenantId ?? null;
  },

  requireTenantId(): string {
    const tenantId = storage.getStore()?.tenantId;
    if (!tenantId) {
      throw new Error('No tenant context. Ensure request passes through RequestContextInterceptor.');
    }
    return tenantId;
  },
};
