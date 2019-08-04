import 'reflect-metadata';
import DecoratorNameSpace from './namespace';
import { ComposeMiddleware } from '@nelts/utils';

export type ResponseType<C> = ComposeMiddleware<C>[];

export default function Response<C>(...args: ComposeMiddleware<C>[]): MethodDecorator {
  return (target, property, descriptor) => {
    let responses: ResponseType<C> = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_RESPONSE, descriptor.value);
    if (!responses) responses = [];
    responses.unshift(...args);
    Reflect.defineMetadata(DecoratorNameSpace.CONTROLLER_RESPONSE, responses, descriptor.value);
  }
}