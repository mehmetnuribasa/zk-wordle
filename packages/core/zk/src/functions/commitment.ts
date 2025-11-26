import { Field, Poseidon } from 'o1js';
import { Commitment } from './types.js';
import { wordToFields } from './utils.js';

function createCommitment(word: string): Commitment {
  const salt = createSalt();
  const commitment = computeCommitment(wordToFields(word), salt);
  return { commitment, salt };
}

function computeCommitment(letters: Field[], salt: Field): Field {
  return Poseidon.hash(letters.concat(salt));
}

function verifyCommitment(
  letters: Field[],
  salt: Field,
  commitment: Field
): boolean {
  return computeCommitment(letters, salt) === commitment;
}

function createSalt(): Field {
  return Field.random(); // TODO: use a secure random number generator
}

export { createCommitment, verifyCommitment };
