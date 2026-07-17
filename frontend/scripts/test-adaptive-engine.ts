// Script to test adaptive calculations
import { calculateExpectedSuccess, calculateEloUpdates } from '../lib/adaptive/elo';
import { BKTParameters, calculateBktPosterior, calculateBktUpdate, determineMasteryState } from '../lib/adaptive/bkt';
import { LinUCB, buildStudentContext, calculateBanditReward } from '../lib/adaptive/bandit';

function testElo() {
  console.log('=== TESTING ELO ===');
  const es = calculateExpectedSuccess(1500, 1600);
  console.log('Expected success (1500, 1600):', es);
  
  const [newS, newQ] = calculateEloUpdates(1500, 1600, 1.0, 1);
  console.log('Elo updates (actual=1.0, hint=1):', { newS, newQ });

  const [newS2, newQ2] = calculateEloUpdates(1500, 1600, 0.0, 0);
  console.log('Elo updates (actual=0.0, hint=0):', { newS2, newQ2 });
}

function testBkt() {
  console.log('\n=== TESTING BKT ===');
  const params = new BKTParameters();
  
  const postCorrect = calculateBktPosterior(0.25, true, params);
  console.log('Posterior Correct (p=0.25):', postCorrect);

  const postIncorrect = calculateBktPosterior(0.25, false, params);
  console.log('Posterior Incorrect (p=0.25):', postIncorrect);

  const updated1 = calculateBktUpdate(0.25, 1.0, params);
  console.log('Updated Mastery (score=1.0):', updated1);
  console.log('Mastery state (0.25 -> 1.0):', determineMasteryState(updated1));

  const updated2 = calculateBktUpdate(0.25, 0.0, params);
  console.log('Updated Mastery (score=0.0):', updated2);
  console.log('Mastery state (0.25 -> 0.0):', determineMasteryState(updated2));
}

function testLinUcb() {
  console.log('\n=== TESTING LINUCB ===');
  const context = buildStudentContext(0.35, 1500);
  console.log('Context vector (p=0.35, elo=1500):', context);

  const bandit = new LinUCB(3, 1.0);
  const armsStates: Record<string, any> = {
    'q1': {
      A_inv: [
        [1.2, 0.1, -0.1],
        [0.1, 1.1, 0.0],
        [-0.1, 0.0, 1.3]
      ],
      b: [0.5, -0.2, 0.8]
    },
    'q2': bandit.getDefaultArmState()
  };

  const [bestArm, bestPred] = bandit.selectArm(context, armsStates, ['q1', 'q2']);
  console.log('Best arm selected:', bestArm, 'with expected reward:', bestPred);

  console.log('Updating arm q1 with reward...');
  const reward = calculateBanditReward(0.74, 1.0);
  console.log('Calculated Reward (expected_success=0.74, actual=1.0):', reward);

  const updatedState = bandit.updateArm('q1', context, reward, armsStates);
  console.log('Updated state for q1:');
  console.log('A_inv:', JSON.stringify(updatedState.A_inv));
  console.log('b:', JSON.stringify(updatedState.b));
}

function runAll() {
  try {
    testElo();
    testBkt();
    testLinUcb();
    console.log('\nAll offline mathematical tests executed successfully.');
  } catch (error) {
    console.error('Test run failed:', error);
  }
}

runAll();
