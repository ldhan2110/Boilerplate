import { LoggerContext } from '../configs/logger-context';

/**
 * Class decorator that wraps every method in LoggerContext.run()
 * so TypeORM query logs show [ServiceName.methodName] as context.
 *
 * Usage:
 *   @LogService()
 *   @Injectable()
 *   export class UsersService { ... }
 */
export function LogService(): ClassDecorator {
  return function (target: Function) {
    const prototype = target.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function',
    );

    for (const methodName of methodNames) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
      if (!descriptor || typeof descriptor.value !== 'function') continue;

      const original = descriptor.value;

      descriptor.value = function (...args: any[]) {
        const caller = `${target.name}.${methodName}`;
        return LoggerContext.run(caller, () => original.apply(this, args));
      };

      Object.defineProperty(prototype, methodName, descriptor);
    }
  };
}
