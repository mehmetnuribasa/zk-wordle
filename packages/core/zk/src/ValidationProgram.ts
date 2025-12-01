import { Field, MerkleTree, Poseidon, Provable, Struct, ZkProgram } from 'o1js';

// TODO: Load from file
const MERKLE_ROOT = Field(
  '11393797897944516075956890799181412499514568812700348680637030886791521329896'
);
const MERKLE_HEIGHT = 15;

class publicInputs extends Struct({
  word: Provable.Array(Field, 5),
  expectedRoot: Field,
}) {}

class privateInputs extends Struct({
  index: Field,
  witness: Provable.Array(Field, MERKLE_HEIGHT),
}) {}

const ValidationProgram = ZkProgram({
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
