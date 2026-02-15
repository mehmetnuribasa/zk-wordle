import { Field, Provable, Proof, Struct, ZkProgram, SelfProof, Bool, Poseidon } from 'o1js';
import { CommitmentProgram } from './CommitmentProgram.js';
import { computeFeedbackFields } from './utils/feedback.js';

class publicInputs extends Struct({
  guessWord: Provable.Array(Field, 5),
  commitment: Field,
  step: Field,
}) {}

class publicOutputs extends Struct({
  feedback: Provable.Array(Field, 5),
  commitment: Field,
  isSolved: Bool,
  step: Field,
}) {}

class privateInputs extends Struct({
  actualWord: Provable.Array(Field, 5),
  salt: Field,
}) {}

const FeedbackProgram: any = ZkProgram({
  name: 'feedback-program',
  publicInput: publicInputs,
  publicOutput: publicOutputs,
  methods: {
    // İlk adım: Sadece commitmentProof kullanılır, önceki kanıt (previousProof) yoktur
    computeFirstFeedback: {

      privateInputs: [CommitmentProgram.Proof, privateInputs],

      async method(
        publicInput: publicInputs,
        commitmentProof: Proof<unknown, { commitment: Field }>,
        privateInput: privateInputs
      ) {

        // Gerekli Doğrulamalar

        // Bu adımın 0. adım olduğundan emin ol
        publicInput.step.assertEquals(Field(0), 'First step must be step 0');

        commitmentProof.verify();

        // CommitmentProgram kanıtından gelen taahhüdü kontrol et
        commitmentProof.publicOutput.commitment.assertEquals(
          publicInput.commitment,
          'Commitment mismatch'
        );

        // Özel girdinin (kelime + salt) gerçekten commitment ile eşleşip eşleşmediğini doğrula
        // Bu, taahhüt edilen kelimeden farklı bir kelime kullanarak oyunucun hile yapmasını önler
        const calculatedCommitment = Poseidon.hash([
          ...privateInput.actualWord, 
          privateInput.salt
        ]);
        
        calculatedCommitment.assertEquals(
          publicInput.commitment, 
          "ERROR: The word used in the proof does not match the initial commitment!"
        );


        // Feedback'i hesapla
        const feedback = computeFeedbackFields(
          privateInput.actualWord,
          publicInput.guessWord
        );

        // Tüm harfler YEŞİL ise, kelimenin doğru tahmin edildiği anlamına gelir
        const isSolved = feedback.reduce(
          (acc, val) => acc.and(val.equals(Field(1))), // 1'in YEŞİL olduğunu varsayıyoruz
          Bool(true)
        );

        return {
          publicOutput: {
            feedback: feedback,
            commitment: publicInput.commitment,
            isSolved: isSolved,
            step: publicInput.step,
          },
        };
      },
    },

    // Sonraki adımlar: Zincirleme devam etmek için previousProof kullanılır
    computeFeedback: {

      privateInputs: [
        SelfProof<publicInputs, publicOutputs>,
        CommitmentProgram.Proof,
        privateInputs,
      ],
      
      async method(
        publicInput: publicInputs,
        previousProof: SelfProof<publicInputs, publicOutputs>,
        commitmentProof: Proof<unknown, { commitment: Field }>,
        privateInput: privateInputs
      ) {

        // Gerekli Doğrulamalar

        // Adımların kesinlikle birer birer arttığından emin ol
        publicInput.step.assertEquals(
            previousProof.publicOutput.step.add(1), 
            'Step must increment by 1'
        );

        // Önceki oyunun henüz bitmemiş olması gerekir
        previousProof.publicOutput.isSolved.assertFalse('Game already finished');

        // Her iki kanıtı da doğrula
        previousProof.verify();
        commitmentProof.verify();

        // PreviousProof'un taahhüdünün şu anki publicInput'taki commitment ile eşleştiğinden emin ol
        previousProof.publicOutput.commitment.assertEquals(
          publicInput.commitment,
          'Commitment mismatch in recursive chain'
        );

        // Tutarlılık için commitmentProof'un eşleştiğini doğrula
        commitmentProof.publicOutput.commitment.assertEquals(
          publicInput.commitment,
          'CommitmentProof commitment mismatch'
        );

        // Özel girdinin (kelime + salt) gerçekten commitment ile eşleşip eşleşmediğini doğrula
        // Bu, zincirleme adımlarda da hile yapılmasını önler
        const calculatedCommitment = Poseidon.hash([
          ...privateInput.actualWord, 
          privateInput.salt
        ]);
        
        calculatedCommitment.assertEquals(
          publicInput.commitment, 
          "ERROR: The word used in the recursive proof does not match the initial commitment!"
        );


        // Feedback'i hesapla
        const feedback = computeFeedbackFields(
          privateInput.actualWord,
          publicInput.guessWord
        );

        // Çözümün bitip bitmediğini kontrol et (Hepsi Yeşil)
        const isSolved = feedback.reduce(
          (acc, val) => acc.and(val.equals(Field(1))), // 1'in YEŞİL olduğunu varsayıyoruz
          Bool(true)
        );

        return {
          publicOutput: {
            feedback: feedback,
            commitment: publicInput.commitment,
            isSolved: isSolved,
            step: publicInput.step,
          },
        };
      },
    },
  },
});

export { FeedbackProgram };
