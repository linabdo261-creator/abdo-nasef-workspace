"use client";
import { memo } from "react";
import type { SimSnapshot } from "@/lib/sim";

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
