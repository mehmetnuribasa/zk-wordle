import { Field, Provable, Struct, ZkProgram } from 'o1js';
import { createCommitment } from './functions/commitment.js';

class publicInputs extends Struct({
  guessWord: Provable.Array(Field, 5),
  commitment: Field,
}) {}

class privateInputs extends Struct({
  actualWord: Provable.Array(Field, 5),
  salt: Field,
}) {}

class publicOutputs extends Struct({
  feedback: Provable.Array(Field, 5),
}) {}

const CommitmentProgram = ZkProgram({
  name: 'commitment-program',
  publicInput: publicInputs,
  publicOutput: publicOutputs,
  methods: {
    createCommitment: {
      privateInputs: [privateInputs],
      async method(publicInput: publicInputs, privateInput: privateInputs) {
        const commitment = createCommitment(privateInput.guessWord);
        return {
          publicOutput: {
            commitment,
          },
        };
      },
    },
  },
});

export { CommitmentProgram };
