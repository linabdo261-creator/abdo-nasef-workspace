"use client";

import { useCallback, useState } from "react";
import { AIRCRAFT_LIST, mpsToKnots, type ScenarioId } from "@/lib/sim";
import { useSimulation } from "./useSimulation";
import OutsideView from "./components/OutsideView";
import { InstrumentPanel } from "./components/InstrumentPanel";
import { SystemsPanel } from "./components/SystemsPanel";
import { AutopilotPanel } from "./components/AutopilotPanel";
import { ControlsBar } from "./components/ControlsBar";
import { Checklist } from "./components/Checklist";
import { Hud } from "./components/Hud";
import { Annunciators } from "./components/Annunciators";
import { EventToasts } from "./components/EventToasts";

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: "coldAndDark", label: "Cold & Dark" },
  { id: "readyForTakeoff", label: "Ready for T/O" },
  { id: "cruise", label: "Cruise" },
  { id: "shortFinal", label: "Short Final" },
];
const SAVE_KEY = "open-sim-save-v1";

type Tab = "systems" | "autopilot" | "checklist";

export default function Simulator() {
  const sim = useSimulation("coldAndDark");
  const {
    engineRef,
    snapshot,
    events,
    paused,
    togglePaused,
    view,
    setView,
    timeOfDay,
    setTimeOfDay,
    aircraftId,
    setAircraft,
    applyScenario,
    setLever,
    save,
    load,
    registerFrameListener,
  } = sim;

  const [scenario, setScenario] = useState<ScenarioId>("coldAndDark");
  const [tab, setTab] = useState<Tab>("systems");
  const [message, setMessage] = useState<string | null>(null);

  const flash = useCallback((m: string) => {
    setMessage(m);
    window.setTimeout(() => setMessage(null), 2500);
  }, []);

  const onScenario = (id: ScenarioId) => {
    setScenario(id);
    applyScenario(id);
    flash(`Loaded scenario: ${SCENARIOS.find((s) => s.id === id)?.label}`);
  };

  const onAircraft = (id: string) => {
    setAircraft(id, "coldAndDark");
    setScenario("coldAndDark");
    flash(`Aircraft: ${AIRCRAFT_LIST.find((a) => a.id === id)?.name}`);
  };

  const def = engineRef.current?.def ?? AIRCRAFT_LIST[0];

  const onSave = () => {
    try {
      localStorage.setItem(SAVE_KEY, save());
      flash("Flight saved");
    } catch {
      flash("Save failed");
    }
  };

  const onLoad = () => {
    try {
      const text = localStorage.getItem(SAVE_KEY);
      if (!text) return flash("No saved flight");
      load(text);
      flash("Flight loaded");
    } catch {
      flash("Load failed — incompatible save");
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-5 text-gray-200 selection:bg-indigo-500/30">
      <div className="mx-auto max-w-7xl">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-gray-900 pb-3">
          <h1 className="mr-2 font-sans text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Flight Sim
            <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-medium text-gray-400 border border-gray-800">
              {def.name}
            </span>
          </h1>

          <div className="flex flex-wrap items-center gap-1">
            {AIRCRAFT_LIST.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onAircraft(a.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  aircraftId === a.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/40"
                    : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                {a.id === "c172" ? "C172" : a.id === "b78x" ? "787-10" : a.name}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-gray-800 hidden sm:block" />

          <div className="flex flex-wrap items-center gap-1">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onScenario(s.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  scenario === s.id
                    ? "bg-sky-600 text-white shadow-sm shadow-sky-900/40"
                    : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1">
            <ToolbarButton onClick={() => setView(view === "cockpit" ? "exterior" : "cockpit")}>
              {view === "cockpit" ? "Cockpit View" : "Exterior View"}
            </ToolbarButton>
            <ToolbarButton onClick={() => setTimeOfDay(timeOfDay === "day" ? "night" : "day")}>
              {timeOfDay === "day" ? "Daylight" : "Night Mode"}
            </ToolbarButton>
            <ToolbarButton onClick={togglePaused} active={paused}>
              {paused ? "Resume" : "Pause"}
            </ToolbarButton>
            <ToolbarButton onClick={onSave}>Save</ToolbarButton>
            <ToolbarButton onClick={onLoad}>Load</ToolbarButton>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* 3D view + overlays */}
          <div className="relative h-[58vh] min-h-[400px] overflow-hidden rounded-lg border border-gray-800 bg-black lg:col-span-2 shadow-2xl">
            <OutsideView registerFrameListener={registerFrameListener} view={view} timeOfDay={timeOfDay} />
            
            {snapshot && (
              <div className="absolute inset-x-3 top-3 flex flex-col gap-2 pointer-events-none">
                <Hud snapshot={snapshot} />
                <Annunciators snapshot={snapshot} />
              </div>
            )}

            {snapshot && (
              <div className="absolute bottom-3 left-3 w-72 pointer-events-auto">
                <EventToasts events={events} />
              </div>
            )}

            {paused && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <span className="rounded bg-black/80 px-6 py-3 font-mono text-xl font-bold tracking-widest text-white border border-gray-800 shadow-xl">
                  SIMULATION PAUSED
                </span>
              </div>
            )}
            
            {message && (
              <div className="absolute bottom-3 right-3 rounded border border-sky-800 bg-sky-950/80 px-3 py-1.5 text-xs font-semibold text-sky-300 shadow-lg backdrop-blur-sm animate-fade-in">
                {message}
              </div>
            )}
          </div>

          {/* Instruments */}
          <div className="lg:col-span-1">
            {snapshot ? (
              <InstrumentPanel
                instruments={snapshot.instruments}
                state={snapshot.state}
                rpm={snapshot.systems.engine.rpm}
                n1={snapshot.systems.engine.n1 ?? 0}
                engineType={def.engineType}
                speeds={{
                  stallClean: mpsToKnots(def.speeds.stallClean),
                  stallLanding: mpsToKnots(def.speeds.stallLanding),
                  maxFlap: mpsToKnots(def.speeds.maxFlap),
                  neverExceed: mpsToKnots(def.speeds.neverExceed),
                }}
                lit={timeOfDay === "day" || engineRef.current?.systems.lights.panel === true}
              />
            ) : (
              <div className="rounded-lg border border-gray-800 bg-[#070a0f] p-12 text-center text-sm text-gray-500 font-medium">
                Initializing simulation layers…
              </div>
            )}
          </div>
        </div>

        {/* Controls bar */}
        {snapshot && engineRef.current && (
          <div className="mt-4">
            <ControlsBar snapshot={snapshot} setLever={setLever} />
          </div>
        )}

        {/* Lower panels */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-2">
            <div className="flex gap-1 bg-black p-1 rounded-md border border-gray-900 self-start">
              {(["systems", "autopilot", "checklist"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded px-3 py-1 text-xs font-bold capitalize tracking-wide transition-all ${
                    tab === t 
                      ? "bg-sky-600 text-white" 
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {snapshot && engineRef.current && (
              <div className="flex-1">
                {tab === "systems" && <SystemsPanel snapshot={snapshot} setLever={setLever} />}
                {tab === "autopilot" && <AutopilotPanel snapshot={snapshot} setLever={setLever} />}
                {tab === "checklist" && <Checklist />}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <KeyMap />
          </div>
        </div>
      </div>
    </main>
  );
}

function ToolbarButton({
  children,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all border ${
        active 
          ? "bg-amber-500/25 text-amber-300 border-amber-800/50" 
          : "bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function KeyMap() {
  const rows: [string, string][] = [
    ["Pitch", "↑ Nose Down / ↓ Nose Up"],
    ["Roll", "← Left / → Right"],
    ["Rudder", "Q / E"],
    ["Throttle", "W / S"],
    ["Mixture", "R / F"],
    ["Trim", "T Nose-Up / G Nose-Down"],
    ["Flaps", ", Retract / . Extend"],
    ["Brakes", "Space (Hold) · B Park"],
    ["Pause", "P"],
  ];

  return (
    <section className="rounded-lg border border-gray-800 bg-[#0b0e15]/90 p-3 shadow-lg">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-900 pb-1">
        Keyboard Commands
      </h3>
      <dl className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs items-center py-0.5 border-b border-gray-950 last:border-0">
            <dt className="text-gray-500 font-medium">{k}</dt>
            <dd className="font-mono text-gray-300 bg-black/40 px-1.5 py-0.5 rounded border border-gray-900/30">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] leading-relaxed text-gray-500 bg-black/20 p-2 rounded border border-gray-900/50">
        Click cockpit panel controls to interact with switches. <br/>
        <span className="text-amber-500 font-semibold">Cold & Dark Start sequence:</span> BAT Switch ON → Fuel Mixture RICH → Magnetos BOTH → Hold START → ALT Switch ON.
      </p>
    </section>
  );
}
