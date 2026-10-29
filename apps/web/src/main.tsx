import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Difficulty } from '@dsa/shared';

// Placeholder page until the router and real pages arrive in later milestones.
function App() {
  return (
    <main>
      <h1>DSA Sheet</h1>
      <p>Difficulty levels:</p>
      <ul>
        {Object.values(Difficulty).map((level) => (
          <li key={level}>{level}</li>
        ))}
      </ul>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
