import { Field } from 'o1js';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import { FeedbackProgram } from './FeedbackProgram.js';
import { FeedbackType } from './utils/types.js';
import { wordToFields } from './utils/utils.js';

const toBigIntArray = (fields: Field[]) =>
  fields.map((field) => field.toBigInt());

describe('FeedbackProgram', () => {
  before(async () => {
    await FeedbackProgram.compile();
  });

  it('returns all green feedback when guess matches actual word', async () => {
    const guessWord = wordToFields('hello');
    const actualWord = wordToFields('hello');

    const { proof } = await FeedbackProgram.computeFeedback(
      { guessWord, commitment: Field(0) },
      { actualWord, salt: Field(0) }
    );

    const feedback = toBigIntArray(proof.publicOutput.feedback);
    assert.deepStrictEqual(feedback, Array(5).fill(BigInt(FeedbackType.GREEN)));
  });

  it('produces mixed feedback for partial matches', async () => {
    const guessWord = wordToFields('hills');
    const actualWord = wordToFields('hello');

    const { proof } = await FeedbackProgram.computeFeedback(
      { guessWord, commitment: Field(0) },
      { actualWord, salt: Field(0) }
    );

    const feedback = toBigIntArray(proof.publicOutput.feedback);
    assert.deepStrictEqual(
      feedback,
      [
        FeedbackType.GREEN,
        FeedbackType.GRAY,
        FeedbackType.GREEN,
        FeedbackType.GREEN,
        FeedbackType.GRAY,
      ].map(BigInt)
    );
  });

  it('flags misplaced letters as yellow', async () => {
    // 'hello' vs 'ohlle' -> all letters exist but shuffled
    const guessWord = wordToFields('hello');
    const actualWord = wordToFields('ohlle');

    const { proof } = await FeedbackProgram.computeFeedback(
      { guessWord, commitment: Field(0) },
      { actualWord, salt: Field(0) }
    );

    const feedback = toBigIntArray(proof.publicOutput.feedback);
    assert.deepStrictEqual(
      feedback,
      [
        FeedbackType.YELLOW,
        FeedbackType.YELLOW,
        FeedbackType.GREEN,
        FeedbackType.GREEN,
        FeedbackType.YELLOW,
      ].map(BigInt)
    );
  });
});
