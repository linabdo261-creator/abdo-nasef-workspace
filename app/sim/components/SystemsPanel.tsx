"use client";

import { memo } from "react";
import type { SimSnapshot } from "@/lib/sim";

interface Props {
  snapshot: SimSnapshot;
  setLever: (partial: any) => void;
}

function SystemsPanelInner({ snapshot, setLever }: Props) {
  const sys = snapshot.systems;
  const eng = snapshot.engine;

  const toggle = (key: string) => {
    setLever({ [key]: !((sys as any)[key] ?? (eng as any)[key]) });
  };

  const Switch = ({ label, active, onClick, color = "bg-red-600" }: {
    label: string;
    active: boolean;
    onClick: () => void;
    color?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 w-10 flex-col items-center justify-between rounded border border-gray-800 p-1 text-[9px] font-bold uppercase transition-all ${
        active 
          ? `${color} text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]` 
          : "bg-gray-900 text-gray-500"
      }`}
    >
      <div className={`h-2 w-full rounded-sm ${active ? "bg-white" : "bg-gray-700"}`} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="rounded-lg border border-gray-800 bg-[#0b0e15] p-3 text-white">
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Electrical & Systems Panel
      </h3>
      
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded border border-gray-900 bg-black/40 p-2">
          <div className="text-[9px] uppercase tracking-wide text-gray-500">Volts / Amps</div>
          <div className="font-monospace text-sm font-bold text-amber-400">
            {sys.voltage.toFixed(1)}V <span className="text-xs text-gray-400">/</span> {sys.batteryAmps.toFixed(1)}A
          </div>
        </div>
        <div className="rounded border border-gray-900 bg-black/40 p-2">
          <div className="text-[9px] uppercase tracking-wide text-gray-500">Fuel Quantity</div>
          <div className="font-monospace text-sm font-bold text-emerald-400">
            {(sys.fuelLeftGallons + sys.fuelRightGallons).toFixed(1)} GAL
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Switch label="Bat" active={sys.batteryOn} onClick={() => toggle("batteryOn")} />
        <Switch label="Alt" active={sys.alternatorOn} onClick={() => toggle("alternatorOn")} />
        <Switch label="Avn" active={sys.avionicsMasterOn} onClick={() => toggle("avionicsMasterOn")} color="bg-blue-600" />
        <Switch label="Pump" active={sys.fuelPumpOn} onClick={() => toggle("fuelPumpOn")} color="bg-orange-600" />
        
        <div className="h-14 w-[1px] bg-gray-800 mx-1" />

        <Switch label="Bcn" active={sys.beaconLightOn} onClick={() => toggle("beaconLightOn")} color="bg-amber-600" />
        <Switch label="Nav" active={sys.navLightOn} onClick={() => toggle("navLightOn")} color="bg-emerald-600" />
        <Switch label="Stb" active={sys.strobeLightOn} onClick={() => toggle("strobeLightOn")} color="bg-blue-500" />
        <Switch label="Taxi" active={sys.taxiLightOn} onClick={() => toggle("taxiLightOn")} color="bg-gray-600" />
        <Switch label="Lnd" active={sys.landingLightOn} onClick={() => toggle("landingLightOn")} color="bg-gray-500" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-900 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Magnetos / Ignition</span>
        <div className="flex bg-black rounded p-0.5 border border-gray-800">
          {["OFF", "R", "L", "BOTH", "START"].map((mode, idx) => {
            const isCurrent = eng.magnetoMode === idx;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setLever({ magnetoMode: idx })}
                className={`px-2 py-1 text-[9px] font-extrabold rounded-sm transition-all ${
                  isCurrent ? "bg-amber-500 text-black" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const SystemsPanel = memo(SystemsPanelInner);
