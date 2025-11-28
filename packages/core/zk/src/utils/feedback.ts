import { Bool, Field, Provable } from 'o1js';
import { wordToFields } from './utils.js';
import { FeedbackType } from './types.js';

function computeFeedbackFields(
  actualWordFields: Field[],
  guessFields: Field[]
): Field[] {
  const feedback: Field[] = Array.from({ length: 5 }, () =>
    Field(FeedbackType.GRAY)
  );
  const used: Bool[] = Array.from({ length: 5 }, () => Bool(false));

  // Green pass
  for (let i = 0; i < 5; i++) {
    const isGreen = guessFields[i].equals(actualWordFields[i]);
    feedback[i] = Provable.if(isGreen, Field(FeedbackType.GREEN), feedback[i]);
    used[i] = Provable.if(isGreen, Bool(true), used[i]);
  }

  // Yellow pass
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const notUsed = used[j].not();
      const matches = guessFields[i].equals(actualWordFields[j]);
      const isValid = notUsed.and(matches);

      feedback[i] = Provable.if(
        isValid,
        Field(FeedbackType.YELLOW),
        feedback[i]
      );
      used[j] = Provable.if(isValid, Bool(true), used[j]);
    }
  }

  return feedback;
}

function computeFeedback(actualWord: string, guess: string): Field[] {
  const actualWordFields = wordToFields(actualWord);
  const guessFields = wordToFields(guess);
  return computeFeedbackFields(actualWordFields, guessFields);
}

function encodeFeedback(feedback: FeedbackType[]): Field {
  let result = BigInt(0);
  for (let i = 0; i < 5; i++) {
    result += BigInt(feedback[i]) * 3n ** BigInt(i);
  }
  return Field(result);
}

function decodeFeedback(encoded: Field): FeedbackType[] {
  let n = encoded.toBigInt();
  const feedback: FeedbackType[] = [];
  for (let i = 0; i < 5; i++) {
    feedback.push(Number(n % 3n) as FeedbackType);
    n /= 3n;
  }
  return feedback;
}

export {
  computeFeedbackFields,
  computeFeedback,
  encodeFeedback,
  decodeFeedback,
};
