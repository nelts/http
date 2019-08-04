import 'reflect-metadata';
import DecoratorNameSpace from '../namespace';
import { AjvChecker } from '@nelts/utils';

type SchemaCallback = (data: any) => Promise<any>;

export type DynamicValidatorBodyType = SchemaCallback[];

/**
 * header checker
 * @param args object[] | string[]
 * @example
 *  `Decorator.Controller.Request.Dynamic.Validator.Body({...})`
 */
export default function DynamicValidatorBody(schema: SchemaCallback | object): MethodDecorator {
  return (target, property, descriptor) => {
    let schemas: DynamicValidatorBodyType = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_VALIDATOR_BODY, descriptor.value);
    if (!schemas) schemas = [];
    if (typeof schema === 'function') {
      schemas.push(schema as SchemaCallback);
    } else {
      schemas.push(data => AjvChecker(schema, data, 'Body'));
    }
    Reflect.defineMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_VALIDATOR_BODY, schemas, descriptor.value);
  }
}