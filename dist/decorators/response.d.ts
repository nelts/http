import 'reflect-metadata';
import { ComposeMiddleware } from '@nelts/utils';
export declare type ResponseType<C> = ComposeMiddleware<C>[];
export default function Response<C>(...args: ComposeMiddleware<C>[]): MethodDecorator;
