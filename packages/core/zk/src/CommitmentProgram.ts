import { Field, Provable, Struct, ZkProgram } from 'o1js';
import { createCommitment } from './utils/commitment.js';

class privateInputs extends Struct({
  word: Provable.Array(Field, 5),
  salt: Field,
}) {}

class publicOutputs extends Struct({
  commitment: Field,
}) {}

const CommitmentProgram = ZkProgram({
  name: 'commitment-program',
  publicOutput: publicOutputs,
  methods: {
    createCommitment: {
      privateInputs: [privateInputs],
      async method(privateInput: privateInputs) {
        const data = createCommitment(privateInput.word, privateInput.salt);
        return {
          publicOutput: {
            commitment: data.commitment,
          },
        };
      },
    },
  },
});

export { CommitmentProgram };
