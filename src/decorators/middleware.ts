import 'reflect-metadata';
import DecoratorNameSpace from './namespace';
import { ComposeMiddleware } from '@nelts/utils';

export type MiddlewareType<C> = ComposeMiddleware<C>[];

export default function Middleware<C>(...args: ComposeMiddleware<C>[]): MethodDecorator {
  return (target, property, descriptor) => {
    let middlewares: MiddlewareType<C> = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_MIDDLEWARE, descriptor.value);
    if (!middlewares) middlewares = [];
    middlewares.unshift(...args);
    Reflect.defineMetadata(DecoratorNameSpace.CONTROLLER_MIDDLEWARE, middlewares, descriptor.value);
  }
}