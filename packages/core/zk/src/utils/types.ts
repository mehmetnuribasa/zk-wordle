import { Field } from "o1js";

type Commitment = {
    commitment: Field;
    salt: Field;
};

enum FeedbackType {
    GRAY = 0,
    YELLOW = 1,
    GREEN = 2,
}

export { Commitment, FeedbackType };
