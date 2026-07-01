import { useState, useEffect } from 'react';
import { FlightEngine } from '../../lib/sim/flat/engine';

export function useSimulation() {
  const [engine] = useState(() => new FlightEngine());
  const [state, setState] = useState(engine.getState());

  useEffect(() => {
    let active = true;
    const loop = () => {
      if (!active) return;
      engine.update();
      setState(engine.getState());
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { active = false; };
  }, [engine]);

  return { state, controls: engine.controls };
}
