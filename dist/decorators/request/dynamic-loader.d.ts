import 'reflect-metadata';
import { ComposeMiddleware } from '@nelts/utils';
export declare type DynamicLoaderType<C> = ComposeMiddleware<C>[];
export default function DynamicLoader<C>(...args: ComposeMiddleware<C>[]): MethodDecorator;
