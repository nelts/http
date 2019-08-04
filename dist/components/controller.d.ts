import { WorkerPlugin } from '@nelts/worker';
import { MessageSendOptions } from '@nelts/messager';
import Http from '../index';
export default class Controller<T extends WorkerPlugin<Http>> {
    readonly app: T;
    constructor(plugin: T);
    readonly logger: import("log4js").Logger;
    readonly messager: import("@nelts/messager").Worker<import("@nelts/worker").default<Http>>;
    send(method: string, data?: any, options?: MessageSendOptions): number;
    asyncSend(method: string, data?: any, options?: MessageSendOptions): Promise<any>;
    asyncHealth(): Promise<any>;
}
