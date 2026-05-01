import { AsyncLocalStorage } from 'node:async_hooks';

interface UserStore {
  userId: string;
}

const storage = new AsyncLocalStorage<UserStore>();

export const UserContext = {
  run<T>(userId: string, callback: () => T): T {
    return storage.run({ userId }, callback);
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
