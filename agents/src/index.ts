import { triage } from './agents/triage.js';
import { investigate } from './agents/investigate.js';
import { implement } from './agents/implement.js';
import { gateGenerate } from './agents/gate-generate.js';
import { gateEvaluate } from './agents/gate-evaluate.js';

const [, , agent, arg] = process.argv;
const num = Number(arg);

if (!agent || isNaN(num)) {
  console.error('Usage: tsx src/index.ts <agent> <number>');
  console.error('Agents: triage | investigate | implement | gate-generate | gate-evaluate');
  process.exit(1);
}

async function main() {
  switch (agent) {
    case 'triage':
      await triage(num);
      break;
    case 'investigate':
      await investigate(num);
      break;
    case 'implement': {
      const prNumber = await implement(num);
      // Surface PR number to the workflow via stdout
      console.log(`PR_NUMBER=${prNumber}`);
      break;
    }
    case 'gate-generate':
      await gateGenerate(num);
      break;
    case 'gate-evaluate':
      await gateEvaluate(num);
      break;
    default:
      console.error(`Unknown agent: ${agent}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
