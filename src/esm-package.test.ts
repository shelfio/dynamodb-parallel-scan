import {readFileSync} from 'fs';
import path from 'path';

describe('esm package config', () => {
  const root = path.resolve(__dirname, '..');

  it('has ESM fields in package.json', () => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

    expect(pkg.type).toBe('module');
    expect(pkg.exports).toBeDefined();

    // Validate primary export points to ESM entry and types
    const dot = pkg.exports['.'];

    expect(dot).toBeDefined();
    expect(dot.import).toBe('./lib/index.js');
    expect(dot.types).toBe('./lib/index.d.ts');
  });

  it('uses NodeNext resolution in tsconfig', () => {
    const ts = JSON.parse(readFileSync(path.join(root, 'tsconfig.json'), 'utf8'));
    const co = ts.compilerOptions || {};

    expect(['NodeNext', 'nodenext']).toContain(co.module);
    expect(['NodeNext', 'nodenext']).toContain(co.moduleResolution);
  });

  it('source uses .js extensions for relative imports', () => {
    const files = ['src/index.ts', 'src/parallel-scan.ts', 'src/parallel-scan-stream.ts'];
    for (const f of files) {
      const s = readFileSync(path.join(root, f), 'utf8');

      // Allow either import or export from, just ensure .js suffix is present
      expect(s).toMatch(
        /from '\.\/.+\.js'|from "\.\/.+\.js"|export \* from '\.\/.+\.js'|export \* from "\.\/.+\.js"/
      );
    }
  });
});
