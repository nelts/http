import 'reflect-metadata';
import { WorkerPlugin } from '@nelts/worker';
import ControllerComponent from './components/controller';
import Namespace from './decorators/namespace';
import Http from './index';

export type CallBackType<T extends WorkerPlugin<Http>> = (plu: T) => { new(app: T): ControllerComponent<T> };

export default function Scope<T extends WorkerPlugin<Http>>(callback: CallBackType<T>){
  const _callback = (plu: T) => callback(plu);
  Reflect.defineMetadata(Namespace.CONTROLLER_SCOPED, true, _callback);
  return _callback;
}