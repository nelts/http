import 'reflect-metadata';
import RouterMethod from './method';
import RouterPath from './path';

export default function Put(path?: string): MethodDecorator {
  return (target, property, descriptor) => {
    path && RouterPath(path)(target, property, descriptor);
    RouterMethod('PUT')(target, property, descriptor);
  }
}