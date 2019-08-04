import 'reflect-metadata';
import DecoratorNameSpace from '../namespace';
import { ComposeMiddleware } from '@nelts/utils';

export type DynamicFilterType<C> = ComposeMiddleware<C>[];

export default function DynamicFilter<C>(...args: ComposeMiddleware<C>[]): MethodDecorator {
  return (target, property, descriptor) => {
    let filters: DynamicFilterType<C> = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_FILTER, descriptor.value);
    if (!filters) filters = [];
    filters.unshift(...args);
    Reflect.defineMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_FILTER, filters, descriptor.value);
  }
}