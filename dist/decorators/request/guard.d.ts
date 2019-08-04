import 'reflect-metadata';
import { ComposeMiddleware } from '@nelts/utils';
export declare type GuarderType<C> = ComposeMiddleware<C>[];
export default function Guarder<C>(...args: ComposeMiddleware<C>[]): MethodDecorator;
