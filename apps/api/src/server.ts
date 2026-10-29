import { Difficulty, difficultySchema } from '@dsa/shared';

// Placeholder entry point until P2 adds the Express app.
const levels = Object.values(Difficulty).map((level) => difficultySchema.parse(level));

console.log(`API placeholder started. Difficulty levels: ${levels.join(', ')}`);
