import 'reflect-metadata';
import DecoratorNameSpace from '../namespace';
import { ComposeMiddleware } from '@nelts/utils';

export type StaticFilterType<C> = ComposeMiddleware<C>[];

export default function StaticFilter<C>(...args: ComposeMiddleware<C>[]): MethodDecorator {
  return (target, property, descriptor) => {
    let filters: StaticFilterType<C> = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_STATIC_FILTER, descriptor.value);
    if (!filters) filters = [];
    filters.unshift(...args);
    Reflect.defineMetadata(DecoratorNameSpace.CONTROLLER_STATIC_FILTER, filters, descriptor.value);
  }
}