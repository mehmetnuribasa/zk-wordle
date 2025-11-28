import * as fs from "fs";
import * as path from "path";

// Returns the path to the word list which is separated by `\n`.
import wordListPath from "word-list";

const wordArray = fs
    .readFileSync(wordListPath, "utf8")
    .split("\n")
    .filter((word) => word.length === 5);

const outputFilePath = path.resolve(process.cwd(), "data/words.json");

fs.writeFileSync(outputFilePath, JSON.stringify(wordArray, null, 2), "utf8");

console.log(`Saved ${wordArray.length} words to ${outputFilePath}`);
