import 'reflect-metadata';

const AUTO_ID_KEY = Symbol('autoId');

export interface AutoIdMeta {
  propertyKey: string;
  prefix: string;
}

export function AutoId(prefix: string): PropertyDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(AUTO_ID_KEY, { propertyKey: String(propertyKey), prefix }, target.constructor);
  };
}

export function getAutoIdMeta(entity: Function): AutoIdMeta | undefined {
  return Reflect.getMetadata(AUTO_ID_KEY, entity);
}
