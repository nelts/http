import 'reflect-metadata';
import DecoratorNameSpace from '../namespace';
import { ComposeMiddleware } from '@nelts/utils';

export type DynamicLoaderType<C> = ComposeMiddleware<C>[];

export default function DynamicLoader<C>(...args: ComposeMiddleware<C>[]): MethodDecorator {
  return (target, property, descriptor) => {
    let loaders: DynamicLoaderType<C> = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_LOADER, descriptor.value);
    if (!loaders) loaders = [];
    loaders.unshift(...args);
    Reflect.defineMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_LOADER, loaders, descriptor.value);
  }
}