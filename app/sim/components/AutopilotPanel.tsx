"use client";

import { memo } from "react";
import type { SimSnapshot } from "@/lib/sim";

interface Props {
  snapshot: SimSnapshot;
  setLever: (partial: any) => void;
}

function AutopilotPanelInner({ snapshot, setLever }: Props) {
  const ap = snapshot.autopilot;

  const toggle = (key: string) => {
    setLever({ [key]: !(ap as any)[key] });
  };

  const Btn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border border-gray-800 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wider transition-all ${
        active ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30" : "bg-gray-900 text-gray-400 hover:bg-gray-800"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-lg border border-gray-800 bg-[#0b0e15] p-3 text-white">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Autopilot & Avionics Mode Control
        </h3>
        <span className={`h-2 w-2 rounded-full ${ap.engaged ? "bg-emerald-500 animate-pulse" : "bg-gray-700"}`} />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 bg-black/50 p-2 rounded border border-gray-900 font-monospace text-center">
        <div>
          <div className="text-[8px] text-gray-500 uppercase">Target HDG</div>
          <div className="text-sm font-bold text-cyan-400">{String(Math.round(ap.targetHeadingDeg)).padStart(3, "0")}°</div>
        </div>
        <div>
          <div className="text-[8px] text-gray-500 uppercase">Target ALT</div>
          <div className="text-sm font-bold text-cyan-400">{Math.round(ap.targetAltitudeFt).toLocaleString()} FT</div>
        </div>
        <div>
          <div className="text-[8px] text-gray-500 uppercase">Target VS</div>
          <div className="text-sm font-bold text-cyan-400">{Math.round(ap.targetVerticalSpeedFpm)} FPM</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Btn label="AP ENG" active={ap.engaged} onClick={() => toggle("engaged")} />
        <Btn label="HDG" active={ap.headingHold} onClick={() => toggle("headingHold")} />
        <Btn label="ALT" active={ap.altitudeHold} onClick={() => toggle("altitudeHold")} />
        <Btn label="VS" active={ap.vsHold} onClick={() => toggle("vsHold")} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-900 pt-3 text-center">
        <div>
          <div className="text-[8px] uppercase text-gray-500 mb-1">HDG Adj</div>
          <div className="flex justify-center gap-1">
            <button type="button" onClick={() => setLever({ targetHeadingDeg: (ap.targetHeadingDeg - 5 + 360) % 360 })} className="bg-gray-900 hover:bg-gray-800 text-[10px] px-2 py-0.5 rounded border border-gray-800">-5°</button>
            <button type="button" onClick={() => setLever({ targetHeadingDeg: (ap.targetHeadingDeg + 5) % 360 })} className="bg-gray-900 hover:bg-gray-800 text-[10px] px-2 py-0.5 rounded border border-gray-800">+5°</button>
          </div>
        </div>
        <div>
          <div className="text-[8px] uppercase text-gray-500 mb-1">ALT Adj</div>
          <div className="flex justify-center gap-1">
            <button type="button" onClick={() => setLever({ targetAltitudeFt: Math.max(0, ap.targetAltitudeFt - 500) })} className="bg-gray-900 hover:bg-gray-800 text-[10px] px-1 py-0.5 rounded border border-gray-800">-500</button>
            <button type="button" onClick={() => setLever({ targetAltitudeFt: ap.targetAltitudeFt + 500 })} className="bg-gray-900 hover:bg-gray-800 text-[10px] px-1 py-0.5 rounded border border-gray-800">+500</button>
          </div>
        </div>
        <div>
          <div className="text-[8px] uppercase text-gray-500 mb-1">VS Adj</div>
          <div className="flex justify-center gap-1">
            <button type="button" onClick={() => setLever({ targetVerticalSpeedFpm: Math.max(-4000, ap.targetVerticalSpeedFpm - 100) })} className="bg-gray-900 hover:bg-gray-800 text-[10px] px-1 py-0.5 rounded border border-gray-800">-100</button>
            <button type="button" onClick={() => setLever({ targetVerticalSpeedFpm: Math.min(4000, ap.targetVerticalSpeedFpm + 100) })} className="bg-gray-900 hover:bg-gray-800 text-[10px] px-1 py-0.5 rounded border border-gray-800">+100</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const AutopilotPanel = memo(AutopilotPanelInner);
