import 'reflect-metadata';
declare type SchemaCallback = (data: any) => Promise<any>;
export declare type DynamicValidatorFileType = SchemaCallback[];
export default function DynamicValidatorFile(schema: SchemaCallback | object): MethodDecorator;
export {};
