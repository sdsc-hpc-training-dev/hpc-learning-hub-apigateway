# Combined Release Documentation Verification

This is a manual documentation QA recipe, not application source or a CI change.
Run from the repository root with Node.js. It performs only the checks described
in its output; it does not approve policy or test runtime behavior.

The original CommonJS helper is retained below because this repository's typed
application lint configuration does not admit standalone documentation scripts.
No lint rule, exclusion, TypeScript setting, or required check is changed.

```sh
node -e "const fs=require('node:fs'),p=require('node:path'); const f=p.resolve('docs/review/validate-release-docs.md'); const s=fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n').split('// BEGIN DOCUMENTATION CHECK\n')[1].split('// END DOCUMENTATION CHECK')[0]; new Function('require','__dirname',s)(require,p.dirname(f));"
```

## Verification Source

````javascript
// BEGIN DOCUMENTATION CHECK
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const read = (name) =>
  fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
const spec = read('docs/specs/ingestion-worker.md');
const decisions = read('docs/contracts/decisions-needed.md');
const ids = [...spec.matchAll(/\*\*IW-(\d{3})\b/g)].map((m) => m[1]);
assert.equal(ids.length, 32);
assert.equal(new Set(ids).size, 32);
const matrix = spec
  .split('## 10. Deterministic Acceptance Matrix')[1]
  .split('## 11.')[0];
for (const id of ids)
  assert(matrix.includes(`IW-${id}`), `IW-${id}: missing acceptance coverage`);
for (let n = 1; n <= 5; n++) {
  assert(spec.includes(`D${n}:`), `Spec missing D${n}`);
  assert(decisions.includes(`D${n}`), `Central crosswalk missing D${n}`);
}

// Check navigable publication documents, not historical machine-local review citations.
const names = [
  'README.md',
  'docs/architecture/nestjs-modules.md',
  'docs/specs/ingestion-worker.md',
  'docs/specs/review/ingestion-worker-review-dispositions.md',
  'docs/review/contracts-ingestion-dispositions.md',
];
const unfenced = (text) => text.replace(/```[^\n]*\n[\s\S]*?```/g, '');
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\-\s]/g, '')
    .trim()
    .replace(/\s/g, '-');
const anchors = (text) =>
  new Set([
    ...[...unfenced(text).matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug(m[1])),
    ...[...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]),
  ]);
let localLinks = 0;
for (const name of names) {
  const clean = unfenced(read(name)).replace(/`[^`\n]*`/g, '');
  const references = new Map(
    [...clean.matchAll(/^\[([^\]]+)\]:\s+(\S+)$/gm)].map((m) => [m[1], m[2]]),
  );
  const targets = [...clean.matchAll(/\[[^\]\n]+\]\(([^)]+)\)/g)].map(
    (m) => m[1],
  );
  for (const m of clean.matchAll(/\[[^\]\n]+\]\[([^\]]+)\]/g)) {
    assert(references.has(m[1]), `${name}: undefined reference ${m[1]}`);
    targets.push(references.get(m[1]));
  }
  targets.push(...references.values());
  for (const target of new Set(targets)) {
    if (/^(https?:|mailto:)/.test(target)) continue;
    const [relative, fragment] = target.split('#');
    const file = relative
      ? path.resolve(root, path.dirname(name), relative)
      : path.join(root, name);
    const fromRoot = path.relative(root, file);
    assert(
      !fromRoot.startsWith('..') && !path.isAbsolute(fromRoot),
      `${name}: link outside repository`,
    );
    assert(fs.existsSync(file), `${name}: missing ${target}`);
    if (fragment)
      assert(
        anchors(read(fromRoot)).has(fragment),
        `${name}: missing anchor ${target}`,
      );
    localLinks++;
  }
}
const baseline = execFileSync(
  'git',
  [
    '-C',
    root,
    'show',
    'fda21d619dcc5119f1133501bafa8cc7e800c7cf:docs/system-contracts-v0.1.md',
  ],
  { encoding: 'utf8' },
).replace(/\r\n/g, '\n');
assert.equal(
  read('docs/system-contracts-v0.1.md'),
  baseline,
  'Published v0.1 baseline changed',
);
const svg = fs.readFileSync(
  path.join(root, 'docs/architecture/assets/nestjs-modules.svg'),
);
assert.equal(
  crypto.createHash('sha256').update(svg).digest('hex'),
  '73a27ee56df135c26295a60a2c094b16fb62b735fc1c717a40e91d81434f727f',
  'Reviewed module graph asset changed',
);
console.log(
  `PASS: 32 requirements with matrix coverage, five specialist crosswalk labels, ${localLinks} local links/anchors, unchanged v0.1 and reviewed SVG.`,
);
console.log(
  'Documentation structure only: no policy approval, runtime, model, database or external URL tests.',
);
// END DOCUMENTATION CHECK
````
