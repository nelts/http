import 'reflect-metadata';
import { WorkerPlugin } from '@nelts/worker';
import Http from '../index';
import Context from '../context';
export default function Controller<T extends WorkerPlugin<Http>, C extends Context>(plugin: T): Promise<void>;
