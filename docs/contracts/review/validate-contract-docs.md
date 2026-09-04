# Contract Documentation Verification

This is a manual documentation QA recipe, not application source or a CI change.
Run from the repository root with Node.js. It performs only the checks described
in its output; it does not approve policy or test runtime behavior.

The original CommonJS helper is retained below because this repository's typed
application lint configuration does not admit standalone documentation scripts.
No lint rule, exclusion, TypeScript setting, or required check is changed.

```sh
node -e "const fs=require('node:fs'),p=require('node:path'); const f=p.resolve('docs/contracts/review/validate-contract-docs.md'); const s=fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n').split('// BEGIN DOCUMENTATION CHECK\n')[1].split('// END DOCUMENTATION CHECK')[0]; new Function('require','__dirname',s)(require,p.dirname(f));"
```

## Verification Source

````javascript
// BEGIN DOCUMENTATION CHECK
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../..');
const names = [
  'docs/contracts/system-contracts-v0.2-candidate.md',
  'docs/contracts/decisions-needed.md',
  'docs/contracts/agent-entrypoint.md',
  'docs/contracts/review/contract-revision-handoff.md',
  'docs/contracts/review/contract-review-dispositions.md',
];
const readText = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const args = process.argv.slice(2);
assert(
  args.length === 0 ||
    (args.length === 2 &&
      args[0] === '--companion-revision' &&
      /^[a-f0-9]{40}$/.test(args[1])),
  'Run this published manual recipe without extra arguments; frozen-companion mode is retained only for historical verification.',
);
const companion = new Map();
if (args.length) {
  for (const name of [
    'docs/specs/ingestion-worker.md',
    'docs/specs/review/ingestion-worker-technical-handoff.md',
  ]) {
    companion.set(
      name,
      execFileSync('git', ['-C', root, 'show', `${args[1]}:${name}`], {
        encoding: 'utf8',
      }).replace(/\r\n/g, '\n'),
    );
  }
}
const documents = new Map(
  names.map((name) => [name, readText(path.join(root, name))]),
);
const withoutFences = (text) => text.replace(/```[^\n]*\n[\s\S]*?```/g, '');
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\-\s]/g, '')
    .trim()
    .replace(/\s/g, '-');
const anchors = (text) => {
  const clean = withoutFences(text);
  const explicit = [...clean.matchAll(/<a id="([^"]+)"><\/a>/g)].map(
    (match) => match[1],
  );
  assert.equal(
    new Set(explicit).size,
    explicit.length,
    'duplicate explicit ID',
  );
  return new Set([
    ...explicit,
    ...[...clean.matchAll(/^#{1,6} (.+)$/gm)].map((match) => slug(match[1])),
  ]);
};

let localLinks = 0;
let companionLinks = 0;
let jsonExamples = 0;
for (const [name, text] of documents) {
  assert(!/[^\x00-\x7f]/.test(text), `${name}: unexpected non-ASCII text`);
  anchors(text);
  const clean = withoutFences(text);
  const references = new Map(
    [...clean.matchAll(/^\[([^\]]+)\]:\s+(\S+)$/gm)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  const targets = [...clean.matchAll(/\[[^\]\n]+\]\(([^)]+)\)/g)].map(
    (match) => match[1],
  );
  for (const match of clean.matchAll(/\[[^\]\n]+\]\[([^\]]+)\]/g)) {
    assert(
      references.has(match[1]),
      `${name}: undefined reference ${match[1]}`,
    );
    targets.push(references.get(match[1]));
  }
  for (const target of targets) {
    if (/^https?:\/\//.test(target)) continue;
    const [relative, fragment] = target.split('#');
    const resolved = relative
      ? path.resolve(path.dirname(path.join(root, name)), relative)
      : path.join(root, name);
    const fromRoot = path.relative(root, resolved);
    assert(!fromRoot.startsWith('..'), `${name}: link leaves repository`);
    const frozenText = companion.get(fromRoot.split(path.sep).join('/'));
    assert(
      frozenText !== undefined || fs.existsSync(resolved),
      `${name}: missing link ${target}`,
    );
    if (fragment) {
      assert(
        anchors(frozenText ?? readText(resolved)).has(fragment),
        `${name}: missing anchor ${target}`,
      );
    }
    if (frozenText !== undefined) companionLinks++;
    localLinks++;
  }
  for (const match of text.matchAll(/```json\n([\s\S]*?)\n```/g)) {
    const value = JSON.parse(match[1]);
    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const key of ['requestId', 'messageId', 'clientRequestId']) {
      if (key in value)
        assert(uuid.test(value[key]), `${name}: invalid ${key}`);
    }
    if ('route' in value) {
      assert(
        ['catalog_api', 'general_rag', 'transcript_rag', 'abstain'].includes(
          value.route,
        ),
      );
      assert(
        ['grounded', 'partial', 'general', 'abstained'].includes(
          value.answerMode,
        ),
      );
      for (const milliseconds of Object.values(value.timingMs)) {
        assert(Number.isFinite(milliseconds) && milliseconds >= 0);
      }
    }
    if ('archive_sha256' in value) {
      assert.equal(value.snapshot_id, 'snapshot-v3-20260805T002229Z');
      assert.equal(
        value.archive_sha256,
        '82b16349c93b88ad31fa8d08d76b2ba2a470c0e327151a6bd695b51967cc6945',
      );
    }
    jsonExamples++;
  }
}

const spec = documents.get(names[0]);
const requirements = [
  ...spec.matchAll(/^### ((?:SH|HTTP|DATA|AIDA)-\d{2}):/gm),
];
assert.equal(requirements.length, 22, 'unexpected requirement inventory');
for (let index = 0; index < requirements.length; index++) {
  const current = requirements[index];
  const section = spec.slice(
    current.index,
    requirements[index + 1]?.index ?? spec.indexOf('## Implementation Gates'),
  );
  assert(section.includes('**Source:**'), `${current[1]}: missing source`);
  assert(section.includes('**Acceptance'), `${current[1]}: missing acceptance`);
  assert(section.includes('MUST'), `${current[1]}: missing requirement`);
  assert(anchors(spec).has(current[1]), `${current[1]}: missing anchor`);
}
const decisions = documents.get(names[1]);
assert.equal([...decisions.matchAll(/^## D-\d{2}:/gm)].length, 12);
const decisionIds = anchors(decisions);
for (const text of documents.values()) {
  for (const match of withoutFences(text).matchAll(/\bD-\d{2}\b/g)) {
    assert(decisionIds.has(match[0]), `undefined decision ${match[0]}`);
  }
}
assert.equal(jsonExamples, 5);
console.log(
  `PASS: ${documents.size} documents; ${requirements.length} requirements with source/acceptance sections; 12 decisions; ${jsonExamples} parsed JSON examples; ${localLinks} local links/anchors.`,
);
console.log(
  'Scope: document structure, JSON syntax, example scalar checks, local links. Not application tests, full wire-schema validation, or remote URL reachability.',
);
if (companion.size) {
  console.log(
    `Companion link targets: ${companionLinks} checked against Git ${args[1]}; not integrated files or combined publication QA.`,
  );
}
// END DOCUMENTATION CHECK
````
