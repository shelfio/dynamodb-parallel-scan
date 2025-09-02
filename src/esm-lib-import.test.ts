import path from 'path';
import {existsSync} from 'fs';
import {execFileSync, execSync} from 'child_process';

describe('compiled ESM import', () => {
  const root = path.resolve(__dirname, '..');

  beforeAll(() => {
    const tsc = path.join(root, 'node_modules', '.bin', 'tsc');
    execSync(`${tsc} -p tsconfig.json`, {cwd: root, stdio: 'pipe'});
  });

  it('can import lib/index.js as ESM and has exports', () => {
    const entry = path.join(root, 'lib', 'index.js');

    expect(existsSync(entry)).toBe(true);

    const out = execFileSync(
      process.execPath,
      [
        '-e',
        `import(${JSON.stringify(`file://${entry}`)}).then(m=>{console.log(Object.keys(m).join(','))}).catch(e=>{console.error(e);process.exit(1)})`,
      ],
      {cwd: root, encoding: 'utf8'}
    );
    const keys = out.trim().split(',');

    expect(keys).toEqual(expect.arrayContaining(['parallelScan', 'parallelScanAsStream']));
  });
});
