import 'reflect-metadata';
declare type SchemaCallback = (data: any) => Promise<any>;
export declare type DynamicValidatorBodyType = SchemaCallback[];
export default function DynamicValidatorBody(schema: SchemaCallback | object): MethodDecorator;
export {};
