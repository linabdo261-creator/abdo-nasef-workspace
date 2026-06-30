"use client";

import { memo } from "react";
import type { SimSnapshot } from "@/lib/sim";

interface Props {
  snapshot: SimSnapshot;
  setLever: (partial: any) => void;
}

function ControlsBarInner({ snapshot, setLever }: Props) {
  const c = snapshot.controls;

  const Slider = ({ label, value, onChange, min = 0, max = 1, step = 0.01, color = "bg-amber-500" }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
  }) => (
    <div className="flex flex-col gap-1 flex-1 min-w-[70px]">
      <div className="flex justify-between text-[9px] uppercase tracking-wide text-gray-500 font-bold">
        <span>{label}</span>
        <span className="font-monospace text-gray-300">{Math.round(((value - min) / (max - min)) * 100)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-900 accent-amber-500 border border-gray-800"
      />
    </div>
  );

  return (
    <div className="rounded-lg border border-gray-800 bg-[#0b0e15] p-3 text-white flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-1 flex-wrap gap-4 min-w-[300px]">
        <Slider label="Throttle" value={c.throttle} onChange={(v) => setLever({ throttle: v })} />
        <Slider label="Mixture" value={c.mixture} onChange={(v) => setLever({ mixture: v })} />
        <Slider label="Pitch Trim" min={-1} max={1} value={c.trim} onChange={(v) => setLever({ trim: v })} />
      </div>

      <div className="flex items-center gap-3 border-l border-gray-900 pl-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wide text-gray-500 font-bold">Flaps Detent</span>
          <div className="flex bg-black rounded p-0.5 border border-gray-800">
            {[0, 10, 20, 30].map((deg, idx) => (
              <button
                key={deg}
                type="button"
                onClick={() => setLever({ flaps: idx })}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-sm transition-all ${
                  Math.round(c.flaps) === idx ? "bg-amber-500 text-black" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLever({ parkingBrake: !c.parkingBrake })}
          className={`h-10 px-3 rounded text-xs font-bold uppercase border tracking-wider transition-all ${
            c.parkingBrake
              ? "bg-red-950 text-red-400 border-red-800 shadow-[inset_0_0_8px_rgba(239,68,68,0.2)]"
              : "bg-gray-950 text-gray-500 border-gray-900 hover:text-gray-300"
          }`}
        >
          Park Brake
        </button>
      </div>
    </div>
  );
}

export const ControlsBar = memo(ControlsBarInner);
