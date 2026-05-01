import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestStore {
  tenantId: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestStore>();

export const RequestContext = {
  run<T>(store: RequestStore, callback: () => T): T {
    return storage.run(store, callback);
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

  getUserId(): string | null {
    return storage.getStore()?.userId ?? null;
  },

  requireUserId(): string {
    const userId = storage.getStore()?.userId;
    if (!userId) {
      throw new Error('No user context. Ensure request passes through RequestContextInterceptor.');
    }
    return userId;
  },
};
