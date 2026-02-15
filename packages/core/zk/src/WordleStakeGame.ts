import {
  AccountUpdate,
  Bool,
  Field,
  Provable,
  PublicKey,
  SmartContract,
  State,
  UInt64,
  method,
  state,
} from 'o1js';
import { FeedbackProgram } from './FeedbackProgram.js';

const WINNER_SHARE_BPS = 5000n;
const FEE_BPS = 0n;

class WordleStakeGame extends SmartContract {
  @state(PublicKey) playerA: State<PublicKey> = State<PublicKey>();
  @state(PublicKey) playerB: State<PublicKey> = State<PublicKey>();

  @state(UInt64) stakeAmount: State<UInt64> = State<UInt64>();
  
  // Store two separate commitments for PvP
  // commitmentA is the word chosen by Player A (Game: B tries to guess this)
  // commitmentB is the word chosen by Player B (Game: A tries to guess this)
  @state(Field) commitmentA: State<Field> = State<Field>();
  @state(Field) commitmentB: State<Field> = State<Field>();

  @state(Bool) hasPlayerA: State<Bool> = State<Bool>();
  @state(Bool) hasPlayerB: State<Bool> = State<Bool>();
  @state(Bool) isSettled: State<Bool> = State<Bool>();

  init() {
    super.init();

    this.hasPlayerA.set(Bool(false));
    this.hasPlayerB.set(Bool(false));
    this.isSettled.set(Bool(false));
    this.stakeAmount.set(UInt64.from(0));
    
    // Initialize commitments to 0
    this.commitmentA.set(Field(0));
    this.commitmentB.set(Field(0));
  }

  @method async join(stake: UInt64, commitment: Field) {
    const sender = this.sender.getAndRequireSignature();

    const hasA = this.hasPlayerA.get();
    const hasB = this.hasPlayerB.get();
    const settled = this.isSettled.get();
    // No central commitment check here anymore

    settled.assertFalse('Game already settled, cannot join.');

    if (!hasA.toBoolean()) {
      this.playerA.set(sender);
      this.hasPlayerA.set(Bool(true));
      this.stakeAmount.set(stake);
      
      // Player A sets their own commitment
      this.commitmentA.set(commitment);

      const playerAUpdate = AccountUpdate.createSigned(sender);
      playerAUpdate.send({ to: this.address, amount: stake });
      
      // We expect the contract to have 'stake' amount now
      this.account.balance.getAndRequireEquals().assertEquals(stake);

      return;
    }

    hasA.assertTrue('Player A must join first.');
    hasB.assertFalse('Both players already joined.');

    const playerA = this.playerA.get();
    playerA.equals(sender).assertFalse('Same address cannot be both players.');

    const existingStake = this.stakeAmount.get();
    existingStake.assertEquals(stake);

    this.playerB.set(sender);
    this.hasPlayerB.set(Bool(true));
    
    // Player B sets their own commitment
    this.commitmentB.set(commitment);

    const playerBUpdate = AccountUpdate.createSigned(sender);
    playerBUpdate.send({ to: this.address, amount: stake });

    // We expect the contract to have '2 * stake' amount now
    this.account.balance.getAndRequireEquals().assertEquals(stake.mul(2));
  }

  @method async leave() {
    // Basic leave implementation if player A is alone
    const sender = this.sender.getAndRequireSignature();
    const hasA = this.hasPlayerA.get();
    const hasB = this.hasPlayerB.get();
    const settled = this.isSettled.get();

    settled.assertFalse('Game already settled, cannot leave.');
    hasA.assertTrue('No player to leave.');
    const playerA = this.playerA.get();
    playerA.assertEquals(sender);
    hasB.assertFalse('Cannot leave after Player B joined.');

    const stakeToReturn = this.stakeAmount.get();
    this.send({ to: playerA, amount: stakeToReturn });

    this.hasPlayerA.set(Bool(false));
    this.playerA.set(PublicKey.empty());
    this.stakeAmount.set(UInt64.from(0));
    this.commitmentA.set(Field(0));
  }

  // Settle now checks if a player solved the OPPONENT'S commitment
  @method async settle(finalProof: InstanceType<typeof FeedbackProgram.Proof>) {
    const hasA = this.hasPlayerA.get();
    const hasB = this.hasPlayerB.get();
    const settled = this.isSettled.get();

    hasA.assertTrue('Player A not joined.');
    hasB.assertTrue('Player B not joined.');
    settled.assertFalse('Game already settled.');

    finalProof.verify();

    // Assert the game is actually solved
    finalProof.publicOutput.isSolved.assertTrue('Game is not solved according to proof.');

    const commitmentA = this.commitmentA.get();
    const commitmentB = this.commitmentB.get();
    const solvedCommitment = finalProof.publicOutput.commitment;

    // Check who won based on WHICH commitment was solved
    // If commitmentA was solved -> It means B guessed A's word -> B Wins
    // If commitmentB was solved -> It means A guessed B's word -> A Wins
    
    const isCommitmentA = solvedCommitment.equals(commitmentA);
    const isCommitmentB = solvedCommitment.equals(commitmentB);

    // The solved commitment MUST be one of the two active commitments
    isCommitmentA.or(isCommitmentB).assertTrue('Proof commitment does not match either player');

    // If A's word is solved, B is the winner.
    // If B's word is solved, A is the winner.
    const winnerIsB = isCommitmentA;
    const winnerIsA = isCommitmentB;

    const playerA = this.playerA.get();
    const playerB = this.playerB.get();
    const stake = this.stakeAmount.get();
    
    // Calculate Payouts
    const total = stake.mul(2);
    const extraFromLoser = stake.mul(Number(WINNER_SHARE_BPS)).div(10000); // e.g. 50% extra
    const winnerAmount = stake.add(extraFromLoser);
    const loserAmount = total.sub(winnerAmount);

    const winnerAmountA = Provable.if(winnerIsA, winnerAmount, UInt64.from(0));
    const winnerAmountB = Provable.if(winnerIsB, winnerAmount, UInt64.from(0));
    const loserAmountA = Provable.if(winnerIsA, loserAmount, UInt64.from(0));
    const loserAmountB = Provable.if(winnerIsB, loserAmount, UInt64.from(0));

    // Send payouts
    this.send({ to: playerA, amount: winnerAmountA.add(loserAmountA) });
    this.send({ to: playerB, amount: winnerAmountB.add(loserAmountB) });

    this.isSettled.set(Bool(true));
  }
}

export { WordleStakeGame, WINNER_SHARE_BPS, FEE_BPS };
