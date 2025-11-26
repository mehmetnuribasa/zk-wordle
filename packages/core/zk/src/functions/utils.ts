import { Field } from "o1js";

function wordToFields(word: string): Field[] {
    if (word.length !== 5) throw new Error("Word must be 5 letters");
    return word.split("").map((letter) => Field(BigInt(letter.charCodeAt(0))));
}

export { wordToFields };
