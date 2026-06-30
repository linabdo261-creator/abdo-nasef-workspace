"use client";
import { memo } from "react";

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
