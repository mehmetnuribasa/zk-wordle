"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wordToFields = wordToFields;
var o1js_1 = require("o1js");
function wordToFields(word) {
    if (word.length !== 5)
        throw new Error("Word must be 5 letters");
    return word.split("").map(function (letter) { return (0, o1js_1.Field)(BigInt(letter.charCodeAt(0))); });
}
