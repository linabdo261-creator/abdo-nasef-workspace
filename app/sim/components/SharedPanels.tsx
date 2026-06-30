"use client";
import { memo } from "react";
import type { SimSnapshot } from "@/lib/sim";

export const Checklist = memo(function Checklist() {
  const items = [
    "Pre-flight: Battery Switch ON, Alternator ON",
    "Engine Start: Fuel Mixture RICH, Magnetos START",
    "Before Takeoff: Set Flaps 10°, Release Parking Brake",
    "In Flight: Adjust Trim, Maintain Pitch Reference",
  ];
  return (
    <div className="rounded-lg border border-gray-800 bg-[#0b0e15]/90 p-3 text-white">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Standard Operating Checklist</h3>
      <ul className="space-y-1.5 text-xs text-gray-300">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 rounded border-gray-800 bg-black text-amber-500 focus:ring-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export const Hud = memo(function Hud({ snapshot }: { snapshot: SimSnapshot }) {
  const s = snapshot.state;
  return (
    <div className="grid grid-cols-4 gap-2 bg-black/60 p-2 rounded-md border border-gray-800 text-center font-monospace text-xs text-emerald-400 backdrop-blur-sm">
      <div>ALT: {Math.round(s.altitude * 3.28084)} FT</div>
      <div>SPD: {Math.round(snapshot.instruments.indicatedAirspeed * 1.94384)} KT</div>
      <div>HDG: {String(Math.round(s.heading * (180 / Math.PI)) % 360).padStart(3, "0")}°</div>
      <div>VS: {Math.round(snapshot.instruments.verticalSpeed * 196.85)} FPM</div>
    </div>
  );
});

export const Annunciators = memo(function Annunciators({ snapshot }: { snapshot: SimSnapshot }) {
  const sys = snapshot.systems;
  const eng = snapshot.engine;
  const warnings = [
    { label: "OIL PRES", active: eng.rpm > 200 && eng.oilPressure < 30, color: "bg-red-600 text-white" },
    { label: "LOW VOLTS", active: sys.voltage < 24.5, color: "bg-red-600 text-white" },
    { label: "STALL", active: snapshot.instruments.indicatedAirspeed < 42 && eng.rpm > 500, color: "bg-red-600 text-white animate-pulse" },
    { label: "FUEL PUMP", active: sys.fuelPumpOn, color: "bg-orange-600 text-white" },
  ];
  return (
    <div className="flex flex-wrap gap-1 bg-[#070a0f] p-1.5 rounded border border-gray-900">
      {warnings.map((w, idx) => (
        <div key={idx} className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${w.active ? `${w.color} border-transparent` : "bg-gray-950 text-gray-700 border-gray-900"}`}>
          {w.label}
        </div>
      ))}
    </div>
  );
});

export const EventToasts = memo(function EventToasts({ events }: { events: any[] }) {
  return (
    <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto font-monospace text-[11px] text-gray-400 bg-black/30 p-2 rounded border border-gray-900">
      {events.length === 0 ? (
        <span className="italic text-gray-600">No recent telemetry events logs...</span>
      ) : (
        events.map((e, idx) => (
          <div key={idx} className="border-l-2 border-amber-500 pl-2">
            <span className="text-gray-500">[{new Date(e.timestamp || Date.now()).toLocaleTimeString()}]</span> {e.message || JSON.stringify(e)}
          </div>
        ))
      )}
    </div>
  );
});
