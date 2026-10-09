import assert from 'node:assert/strict';
import {decideFeedback} from './feedback-budget.mjs';
export function testFeedbackBudget(){
 const policy={nowMs:100000,windowMs:60000,maxAccepted:3,cooldownMs:10000};
 let counter;let accepted=0;
 // Sequential transaction simulation; NOT a distributed-concurrency proof.
 for(let n=0;n<20;n++){const r=decideFeedback({...policy,counter});if(r.writeFeedback){accepted++;counter=r.nextCounter;}}
 assert.equal(accepted,3);
 assert.equal(decideFeedback({...policy,counter,duplicateReceipt:'receipt'}).action,'REUSE');
 assert.equal(decideFeedback({...policy,lastAcceptedMs:99999}).action,'DENY_COOLDOWN');
 assert.equal(decideFeedback({...policy,nowMs:180000,counter}).action,'ACCEPT');
 for(const input of [{maxAccepted:0},{nowMs:NaN},{counter:{window:2,accepted:1}},{lastAcceptedMs:100001}])assert.throws(()=>decideFeedback({...policy,...input}));
 console.log('PASS: proposal-only budget/idempotency/cooldown/window/fail-closed policy. No deployed broker, production writes or distributed-concurrency claim.');
}
if(process.argv[1]?.endsWith('/feedback-budget.test.mjs'))testFeedbackBudget();
