// Import necessary modules and dependencies
import { Field } from 'o1js';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import { CommitmentProgram } from './CommitmentProgram.js';
import { createCommitment } from './utils/commitment.js';
import { wordToFields } from './utils/utils.js';

describe('CommitmentProgram', () => {
  // Compile the CommitmentProgram before running tests
  before(async () => {
    await CommitmentProgram.compile();
  });

  // Test case: Verify that the commitment matches the helper function's computation
  it('matches helper commitment computation', async () => {
    const word = wordToFields('hello'); // Convert the word 'hello' to Field[]
    const salt = Field(123n); // Define a salt value as a Field

    // Compute the expected commitment using the helper function
    const expected = createCommitment(word, salt).commitment;

    // Generate the commitment using the CommitmentProgram
    const { proof } = await CommitmentProgram.createCommitment({
      word,
      salt,
    });

    // Assert that the generated commitment matches the expected commitment
    assert.strictEqual(
      proof.publicOutput.commitment.toString(),
      expected.toString()
    );
  });

  // Test case: Ensure different salts produce different commitments
  it('produces different commitments for different salts', async () => {
    const word = wordToFields('hello'); // Convert the word 'hello' to Field[]
    const saltA = Field(1n); // Define the first salt value
    const saltB = Field(2n); // Define the second salt value

    // Generate the commitment using the first salt
    const { proof: proofA } = await CommitmentProgram.createCommitment({
      word,
      salt: saltA,
    });

    // Generate the commitment using the second salt
    const { proof: proofB } = await CommitmentProgram.createCommitment({
      word,
      salt: saltB,
    });

    // Assert that the commitments are different
    assert.notStrictEqual(
      proofA.publicOutput.commitment.toString(),
      proofB.publicOutput.commitment.toString()
    );
  });
});
