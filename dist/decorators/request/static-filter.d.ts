import 'reflect-metadata';
import { ComposeMiddleware } from '@nelts/utils';
export declare type StaticFilterType<C> = ComposeMiddleware<C>[];
export default function StaticFilter<C>(...args: ComposeMiddleware<C>[]): MethodDecorator;
