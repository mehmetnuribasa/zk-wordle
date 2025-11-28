import { Field, Provable, SelfProof, Struct, ZkProgram } from 'o1js';
import { computeFeedbackFields } from './utils/feedback.js';

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

const FeedbackProgram = ZkProgram({
  name: 'feedback-program',
  publicInput: publicInputs,
  publicOutput: publicOutputs,
  methods: {
    computeFeedback: {
      privateInputs: [privateInputs],
      async method(publicInput: publicInputs, privateInput: privateInputs) {
        const feedback = computeFeedbackFields(
          privateInput.actualWord,
          publicInput.guessWord
        );
        return {
          publicOutput: {
            feedback,
          },
        };
      },
    },
  },
});

export { FeedbackProgram };
