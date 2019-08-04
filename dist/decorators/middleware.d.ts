import 'reflect-metadata';
import { ComposeMiddleware } from '@nelts/utils';
export declare type MiddlewareType<C> = ComposeMiddleware<C>[];
export default function Middleware<C>(...args: ComposeMiddleware<C>[]): MethodDecorator;
