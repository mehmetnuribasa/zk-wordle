import { Field, Poseidon } from "o1js";
import { Commitment } from "./types";

export function createCommitment(word: string): Commitment {
    const salt = createSalt();
    const commitment = computeCommitment(wordToFields(word), salt);
    return { commitment, salt };
}

function computeCommitment(letters: Field[], salt: Field): Field {
    return Poseidon.hash(letters.concat(salt));
}

function wordToFields(word: string): Field[] {
    return word.split("").map((letter) => Field(BigInt(letter.charCodeAt(0))));
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
