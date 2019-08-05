import * as path from 'path';
import Http from '../index';
import * as globby from 'globby';
import { WorkerPlugin } from '@nelts/worker';
import { RequireDefault } from '@nelts/utils';
export default async function Service<T extends WorkerPlugin<Http>>(plugin: T) {
  const cwd = plugin.source;
  const files = await globby([
    'service/**/*.ts', 
    'service/**/*.js', 
    '!service/**/*.d.ts', 
  ], { cwd });
  files.forEach((file: string) => {
    file = path.resolve(cwd, file);
    plugin.app.frameworker.injector.bind(RequireDefault(file));
  });
}