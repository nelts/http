import 'reflect-metadata';
import DecoratorNameSpace from '../namespace';
import { ComposeMiddleware } from '@nelts/utils';

export type GuarderType<C> = ComposeMiddleware<C>[];

export default function Guarder<C>(...args: ComposeMiddleware<C>[]): MethodDecorator {
  return (target, property, descriptor) => {
    let guards: GuarderType<C> = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_GUARD, descriptor.value);
    if (!guards) guards = [];
    guards.unshift(...args);
    Reflect.defineMetadata(DecoratorNameSpace.CONTROLLER_GUARD, guards, descriptor.value);
  }
}