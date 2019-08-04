import 'reflect-metadata';
import { ComposeMiddleware } from '@nelts/utils';
export declare type DynamicFilterType<C> = ComposeMiddleware<C>[];
export default function DynamicFilter<C>(...args: ComposeMiddleware<C>[]): MethodDecorator;
