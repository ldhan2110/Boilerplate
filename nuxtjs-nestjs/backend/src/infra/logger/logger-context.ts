import { AsyncLocalStorage } from 'node:async_hooks';

interface LoggerStore {
  caller: string;
}

const storage = new AsyncLocalStorage<LoggerStore>();

export const LoggerContext = {
  run<T>(caller: string, callback: () => T): T {
    return storage.run({ caller }, callback);
  },

  getCaller(): string | null {
    return storage.getStore()?.caller ?? null;
  },
};
