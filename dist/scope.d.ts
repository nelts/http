import 'reflect-metadata';
import { WorkerPlugin } from '@nelts/worker';
import ControllerComponent from './components/controller';
import Http from './index';
export declare type CallBackType<T extends WorkerPlugin<Http>> = (plu: T) => {
    new (app: T): ControllerComponent<T>;
};
export default function Scope<T extends WorkerPlugin<Http>>(callback: CallBackType<T>): (plu: T) => new (app: T) => ControllerComponent<T>;
