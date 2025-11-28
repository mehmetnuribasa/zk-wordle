import { Field } from 'o1js';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import { CommitmentProgram } from './CommitmentProgram.js';
import { createCommitment } from './utils/commitment.js';
import { wordToFields } from './utils/utils.js';

describe('CommitmentProgram', () => {
  before(async () => {
    await CommitmentProgram.compile();
  });

  it('matches helper commitment computation', async () => {
    const word = wordToFields('hello');
    const salt = Field(123n);

    const expected = createCommitment(word, salt).commitment;
    const { proof } = await CommitmentProgram.createCommitment({
      word,
      salt,
    });

    assert.strictEqual(
      proof.publicOutput.commitment.toString(),
      expected.toString()
    );
  });

  it('produces different commitments for different salts', async () => {
    const word = wordToFields('hello');
    const saltA = Field(1n);
    const saltB = Field(2n);

    const { proof: proofA } = await CommitmentProgram.createCommitment({
      word,
      salt: saltA,
    });

    const { proof: proofB } = await CommitmentProgram.createCommitment({
      word,
      salt: saltB,
    });

    assert.notStrictEqual(
      proofA.publicOutput.commitment.toString(),
      proofB.publicOutput.commitment.toString()
    );
  });
});
