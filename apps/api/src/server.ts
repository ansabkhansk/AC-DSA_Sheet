import http from 'node:http';
import { Difficulty, difficultySchema } from '@dsa/shared';

const port = Number(process.env.PORT) || 4000;
const levels = Object.values(Difficulty).map((level) => difficultySchema.parse(level));
const body = `API placeholder started. Difficulty levels: ${levels.join(', ')}`;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
});

server.listen(port, () => {
  console.log(`API placeholder listening on http://localhost:${port}`);
});
