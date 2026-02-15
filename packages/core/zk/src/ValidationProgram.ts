import { Field, MerkleTree, Poseidon, Provable, Struct, ZkProgram } from 'o1js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type RootFile = {
  root: string;
  count: number;
  height: number;
};

const rootConfigPath = path.resolve(
  __dirname, // build/src
  '..', // build
  '..', // package root
  'src',
  'word-validation',
  'data',
  'words.root.json'
);

const rootConfig: RootFile = JSON.parse(
  fs.readFileSync(rootConfigPath, 'utf8')
);

const MERKLE_ROOT = Field(rootConfig.root);
const MERKLE_HEIGHT = rootConfig.height - 1;

class publicInputs extends Struct({
  word: Provable.Array(Field, 5),
  expectedRoot: Field,
}) {}

class privateInputs extends Struct({
  index: Field,
  witness: Provable.Array(Field, MERKLE_HEIGHT),
}) {}

const ValidationProgram: any = ZkProgram({
  name: 'validation-program',
  publicInput: publicInputs,
  methods: {
    validateWord: {
      privateInputs: [privateInputs],
      async method(publicInput: publicInputs, privateInput: privateInputs) {
        const wordHash = Poseidon.hash(publicInput.word);

        let currentHash = wordHash;
        for (let i = 0; i < MERKLE_HEIGHT; i++) {
          const sibling = privateInput.witness[i];
          const bit = privateInput.index.toBits()[i];
          currentHash = Provable.if(
            bit,
            Poseidon.hash([sibling, currentHash]),
            Poseidon.hash([currentHash, sibling])
          );
        }

        currentHash.assertEquals(publicInput.expectedRoot);
      },
    },
  },
});

export { ValidationProgram, MERKLE_ROOT, MERKLE_HEIGHT };
