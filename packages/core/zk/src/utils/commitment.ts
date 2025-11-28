import { Field, Poseidon } from 'o1js';
import { Commitment } from './types.js';

function createCommitment(word: Field[], salt: Field): Commitment {
  const commitment = computeCommitment(word, salt);
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

export { createCommitment, verifyCommitment };
