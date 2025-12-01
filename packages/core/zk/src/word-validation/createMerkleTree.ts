import { Poseidon, MerkleTree } from 'o1js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { wordToFields } from '../utils/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function hashWord(word: string) {
  const arr = wordToFields(word);
  return Poseidon.hash(arr);
}

function main() {
  const packageRoot = path.resolve(__dirname, '../../..');
  const sourceDir = path.join(packageRoot, 'src/word-validation');
  const dictPath = path.join(sourceDir, 'data/words.json');
  const dictionary: string[] = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

  const leaves = dictionary.map((word) => hashWord(word));

  const height = Math.ceil(Math.log2(leaves.length)) + 1;
  const tree = new MerkleTree(height);

  for (let i = 0; i < leaves.length; i++) {
    tree.setLeaf(BigInt(i), leaves[i]);
  }

  // Export root
  const root = tree.getRoot();
  const outPath = path.join(sourceDir, 'data/words.root.json');

  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        root: root.toString(),
        count: dictionary.length,
        height,
      },
      null,
      2
    )
  );

  const witnesses: Record<string, { index: number; witness: string[] }> = {};
  for (let i = 0; i < dictionary.length; i++) {
    const word = dictionary[i];
    const witness = tree.getWitness(BigInt(i));
    witnesses[word] = {
      index: i,
      witness: witness.map((field) => field.toString()),
    };
  }

  const witnessesPath = path.join(sourceDir, 'data/words.witnesses.json');
  fs.writeFileSync(witnessesPath, JSON.stringify(witnesses, null, 2));

  console.log('Dictionary Merkle tree created.');
  console.log('Root:', root.toString());
  console.log('Height:', height);
  console.log(`Witnesses generated for ${dictionary.length} words.`);
}

main();
