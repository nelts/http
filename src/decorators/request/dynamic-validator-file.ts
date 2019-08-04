import 'reflect-metadata';
import DecoratorNameSpace from '../namespace';
import { AjvChecker } from '@nelts/utils';

type SchemaCallback = (data: any) => Promise<any>;

export type DynamicValidatorFileType = SchemaCallback[];

/**
 * header checker
 * @param args object[] | string[]
 * @example
 *  `Decorator.Controller.Request.Dynamic.Validator.File({...})`
 */
export default function DynamicValidatorFile(schema: SchemaCallback | object): MethodDecorator {
  return (target, property, descriptor) => {
    let schemas: DynamicValidatorFileType = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_VALIDATOR_FILE, descriptor.value);
    if (!schemas) schemas = [];
    if (typeof schema === 'function') {
      schemas.push(schema as SchemaCallback);
    } else {
      schemas.push(data => AjvChecker(schema, data, 'File'));
    }
    Reflect.defineMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_VALIDATOR_FILE, schemas, descriptor.value);
  }
}