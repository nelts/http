import Http from '../index';
import { WorkerPlugin } from '@nelts/worker';
export default function Service<T extends WorkerPlugin<Http>>(plugin: T): Promise<void>;
