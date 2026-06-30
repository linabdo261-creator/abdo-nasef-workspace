"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CESSNA_172,
  SimulationEngine,
  getAircraft,
  stepControls,
  deserializeFromString,
  serializeToString,
  type AircraftDefinition,
  type ControlInputs,
  type ControlTargets,
  type ScenarioId,
  type SimEvent,
  type SimSnapshot,
} from "@/lib/sim";

export type ViewMode = "cockpit" | "exterior";
export type FrameListener = (snapshot: SimSnapshot) => void;

interface LeverTargets {
  throttle: number;
  mixture: number;
  trim: number;
  flaps: number;
  spoilers: number;
  brakes: number;
  parkingBrake: boolean;
  gearDown: boolean;
}

function leversFromControls(c: ControlInputs): LeverTargets {
  return {
    throttle: c.throttle,
    mixture: c.mixture,
    trim: c.trim,
    flaps: c.flaps,
    spoilers: c.spoilers,
    brakes: 0,
    parkingBrake: c.parkingBrake,
    gearDown: c.gearDown,
  };
}

const UI_UPDATE_HZ = 20;

export function useSimulation(initialScenario: ScenarioId = "coldAndDark") {
  const engineRef = useRef<SimulationEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new SimulationEngine(CESSNA_172, {
      scenario: initialScenario,
    });
  }

  const [snapshot, setSnapshot] = useState<SimSnapshot | null>(null);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const eventBuffer = useRef<SimEvent[]>([]);
  const [paused, setPausedState] = useState(false);
  const [view, setView] = useState<ViewMode>("cockpit");
  const [timeOfDay, setTimeOfDay] = useState<"day" | "night">("day");

  const snapshotRef = useRef<SimSnapshot | null>(null);
  const pressedKeys = useRef<Set<string>>(new Set());
  const frameListeners = useRef<Set<FrameListener>>(new Set());
  const lastUiUpdate = useRef(0);
  const lastFrameTime = useRef<number | null>(null);

  const levers = useRef<LeverTargets>(
    leversFromControls(engineRef.current.controls),
  );
  const [aircraftId, setAircraftId] = useState(CESSNA_172.id);

  const registerFrameListener = useCallback((fn: FrameListener) => {
    frameListeners.current.add(fn);
    return () => frameListeners.current.delete(fn);
  }, []);

  const setPaused = useCallback((value: boolean) => {
    setPausedState(value);
    if (engineRef.current) engineRef.current.paused = value;
  }, []);

  const togglePaused = useCallback(
    () => setPaused(!(engineRef.current?.paused ?? false)),
    [setPaused],
  );

  const applyScenario = useCallback((scenario: ScenarioId) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.applyScenario(scenario);
    levers.current = leversFromControls(engine.controls);
  }, []);

  const setAircraft = useCallback(
    (id: string, scenario: ScenarioId = "coldAndDark") => {
      const def: AircraftDefinition = getAircraft(id) ?? CESSNA_172;
      const engine = new SimulationEngine(def, { scenario });
      engineRef.current = engine;
      engine.paused = false;
      setPausedState(false);
      setAircraftId(def.id);
      levers.current = leversFromControls(engine.controls);
    },
    [],
  );

  const setLever = useCallback((partial: Partial<LeverTargets>) => {
    levers.current = { ...levers.current, ...partial };
  }, []);

  const save = useCallback(() => {
    return engineRef.current ? serializeToString(engineRef.current) : "";
  }, []);

  const load = useCallback((text: string) => {
    let def = CESSNA_172;
    try {
      const id = (JSON.parse(text) as { aircraftId?: string }).aircraftId;
      if (id) def = getAircraft(id) ?? CESSNA_172;
    } catch {}
    const engine = deserializeFromString(text, def);
    engineRef.current = engine;
    engine.paused = false;
    setPausedState(false);
    setAircraftId(engine.def.id);
    levers.current = leversFromControls(engine.controls);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "p") {
        togglePaused();
        return;
      }
      if (key === ".") {
        levers.current.flaps = Math.min(
          CESSNA_172.flaps.length - 1,
          Math.round(levers.current.flaps) + 1,
        );
      }
      if (key === ",") {
        levers.current.flaps = Math.max(0, Math.round(levers.current.flaps) - 1);
      }
      if (key === "b") {
        levers.current.parkingBrake = !levers.current.parkingBrake;
      }
      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
      ) {
        e.preventDefault();
      }
      pressedKeys.current.add(key);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [togglePaused]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const engine = engineRef.current;
      if (!engine) return;

      const prev = lastFrameTime.current ?? now;
      const dt = Math.min((now - prev) / 1000, 0.1);
      lastFrameTime.current = now;

      const keys = pressedKeys.current;
      const held = (k: string) => (keys.has(k) ? 1 : 0);

      const lv = levers.current;
      lv.throttle = clamp01(lv.throttle + (held("w") - held("s")) * 0.6 * dt);
      lv.mixture = clamp01(lv.mixture + (held("r") - held("f")) * 0.6 * dt);
      lv.trim = clampPm(lv.trim + (held("g") - held("t")) * 0.25 * dt);

      const targets: ControlTargets = {
        elevator: held("arrowdown") - held("arrowup"),
        aileron: held("arrowright") - held("arrowleft"),
        rudder: held("e") - held("q"),
        throttle: lv.throttle,
        mixture: lv.mixture,
        trim: lv.trim,
        flaps: lv.flaps,
        spoilers: lv.spoilers,
        brakes: Math.max(lv.brakes, keys.has(" ") ? 1 : 0),
        gearDown: lv.gearDown,
        parkingBrake: lv.parkingBrake,
      };

      if (!engine.paused) {
        const smoothed: ControlInputs = stepControls(
          engine.controls,
          targets,
          dt,
        );
        engine.setControls(smoothed);
      }

      const snap = engine.update(dt);
      snapshotRef.current = snap;

      if (snap.events.length) {
        eventBuffer.current.push(...snap.events);
        if (eventBuffer.current.length > 8)
          eventBuffer.current = eventBuffer.current.slice(-8);
      }

      frameListeners.current.forEach((fn) => fn(snap));

      if (now - lastUiUpdate.current > 1000 / UI_UPDATE_HZ) {
        lastUiUpdate.current = now;
        setSnapshot(snap);
        setEvents([...eventBuffer.current]);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return {
    engineRef,
    snapshot,
    snapshotRef,
    events,
    paused,
    setPaused,
    togglePaused,
    view,
    setView,
    timeOfDay,
    setTimeOfDay,
    aircraftId,
    setAircraft,
    applyScenario,
    setLever,
    leversRef: levers,
    save,
    load,
    registerFrameListener,
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clampPm = (v: number) => (v < -1 ? -1 : v > 1 ? 1 : v);
