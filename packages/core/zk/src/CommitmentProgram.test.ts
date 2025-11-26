import { Field } from 'o1js';
import { CommitmentProgram } from './CommitmentProgram.js';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

describe('CommitmentProgram', () => {
  before(async () => {
    await CommitmentProgram.compile();
  });

  it('computes feedback correctly for a known case', async () => {
    const guessWord = [
      Field('h'.charCodeAt(0)),
      Field('e'.charCodeAt(0)),
      Field('l'.charCodeAt(0)),
      Field('l'.charCodeAt(0)),
      Field('o'.charCodeAt(0)),
    ];

    const actualWord = [
      Field('h'.charCodeAt(0)),
      Field('e'.charCodeAt(0)),
      Field('l'.charCodeAt(0)),
      Field('l'.charCodeAt(0)),
      Field('o'.charCodeAt(0)),
    ];

    const commitment = Field(0);
    const salt = Field(0);

    const result = await CommitmentProgram.computeFeedback(
      { guessWord, commitment },
      { actualWord, salt }
    );

    const feedback = result.proof.publicOutput.feedback;
    console.log(result.proof);

    for (let i = 0; i < 5; i++) {
      assert.strictEqual(feedback[i].toBigInt(), BigInt(2));
    }
  });
});
