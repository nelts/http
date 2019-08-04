import 'reflect-metadata';
import DecoratorNameSpace from '../namespace';

export default function Path(path?: string): MethodDecorator {
  return (target, property, descriptor) => {
    Reflect.defineMetadata(DecoratorNameSpace.CONTROLLER_PATH, path || '/', descriptor.value);
  }
}