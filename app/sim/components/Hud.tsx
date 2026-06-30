"use client";
import { memo } from "react";
import type { SimSnapshot } from "@/lib/sim";

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
