// Import necessary modules and dependencies
import { Field } from 'o1js';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import { CommitmentProgram } from './CommitmentProgram.js';
import { FeedbackProgram } from './FeedbackProgram.js';
import { FeedbackType } from './utils/types.js';
import { wordToFields } from './utils/utils.js';

// Helper function to convert Field[] to BigInt[] for easier comparison
const toBigIntArray = (fields: Field[]) =>
  fields.map((field) => field.toBigInt());

// Helper function to generate gray feedback (all incorrect guesses)
const grayFeedback = () =>
  Array.from({ length: 5 }, () => Field(FeedbackType.GRAY));

// Function to create a commitment and its proof for a given word and salt
async function createCommitment(word: string, saltValue = 7n) {
  const wordFields = wordToFields(word); // Convert word to Field[]
  const salt = Field(saltValue); // Create a Field representation of the salt
  const { proof } = await CommitmentProgram.createCommitment({
    word: wordFields,
    salt,
  });

  return {
    wordFields, // The word converted to Field[]
    salt, // The salt used for the commitment
    commitment: proof.publicOutput.commitment, // The generated commitment
    commitmentProof: proof, // The proof for the commitment
  };
}

describe('FeedbackProgram', () => {
  // Compile the CommitmentProgram and FeedbackProgram before running tests
  before(async () => {
    await CommitmentProgram.compile();
    await FeedbackProgram.compile();
  });

  // Test case: All green feedback when the guess matches the actual word
  it('returns all green feedback when guess matches actual word', async () => {
    const { commitment, wordFields, salt, commitmentProof } =
      await createCommitment('hello'); // Create commitment for the word 'hello'
    const guessWord = wordToFields('hello'); // Convert the guess to Field[]

    const { proof } = await FeedbackProgram.computeFirstFeedback(
      { guessWord, commitment, step: Field(0) }, // Public inputs
      commitmentProof, // Proof for the commitment
      { actualWord: wordFields, salt } // Private inputs
    );

    const feedback = toBigIntArray(proof.publicOutput.feedback); // Extract feedback
    assert.deepStrictEqual(feedback, Array(5).fill(BigInt(FeedbackType.GREEN))); // Assert all feedback is GREEN
  });

  // Test case: Chain proofs for multiple guesses
  it('chains proofs so each guess references the prior response', async () => {
    const { commitment, wordFields, salt, commitmentProof } =
      await createCommitment('hello'); // Create commitment for the word 'hello'

    // First guess: 'hills'
    const guessOne = wordToFields('hills');
    const { proof: firstProof } = await FeedbackProgram.computeFirstFeedback(
      { guessWord: guessOne, commitment, step: Field(0) }, // Public inputs for first guess
      commitmentProof, // Proof for the commitment
      { actualWord: wordFields, salt } // Private inputs
    );

    const feedbackOne = toBigIntArray(firstProof.publicOutput.feedback); // Extract feedback for first guess
    assert.deepStrictEqual(
      feedbackOne,
      [
        FeedbackType.GREEN, // First letter matches
        FeedbackType.GRAY, // Second letter does not match
        FeedbackType.GREEN, // Third letter matches
        FeedbackType.GREEN, // Fourth letter matches
        FeedbackType.GRAY, // Fifth letter does not match
      ].map(BigInt)
    );

    // Second guess: 'cello'
    const guessTwo = wordToFields('cello');
    const { proof: secondProof } = await FeedbackProgram.computeFeedback(
      { guessWord: guessTwo, commitment, step: Field(1) }, // Public inputs for second guess
      firstProof, // Proof from the first guess
      commitmentProof, // Proof for the commitment
      { actualWord: wordFields, salt } // Private inputs
    );

    const feedbackTwo = toBigIntArray(secondProof.publicOutput.feedback); // Extract feedback for second guess
    assert.deepStrictEqual(
      feedbackTwo,
      [
        FeedbackType.GRAY, // First letter does not match
        FeedbackType.GREEN, // Second letter matches
        FeedbackType.GREEN, // Third letter matches
        FeedbackType.GREEN, // Fourth letter matches
        FeedbackType.GREEN, // Fifth letter matches
      ].map(BigInt)
    );
  });

  // Test case: Reject guesses that try to change the commitment mid-game
  it('rejects guesses that try to change the commitment mid-game', async () => {
    const {
      commitment: commitmentA,
      wordFields,
      salt,
      commitmentProof: commitmentProofA,
    } = await createCommitment('hello', 11n); // Create commitment for the word 'hello'
    const { commitment: commitmentB, commitmentProof: commitmentProofB } =
      await createCommitment('cigar', 13n); // Create commitment for the word 'cigar'

    // First step with commitmentA
    const { proof: firstProof } = await FeedbackProgram.computeFirstFeedback(
      {
        guessWord: wordToFields('hello'), // First guess matches the actual word
        commitment: commitmentA, // Use commitmentA
        step: Field(0), // First step
      },
      commitmentProofA, // Proof for commitmentA
      { actualWord: wordFields, salt } // Private inputs
    );

    // Try to use commitmentB in second step (should fail)
    await assert.rejects(
      FeedbackProgram.computeFeedback(
        {
          guessWord: wordToFields('cigar'), // Second guess
          commitment: commitmentB, // Attempt to use a different commitment
          step: Field(1), // Second step
        },
        firstProof, // Proof from the first step
        commitmentProofB, // Proof for commitmentB (should not match)
        { actualWord: wordFields, salt } // Private inputs
      )
    );
  });
});
