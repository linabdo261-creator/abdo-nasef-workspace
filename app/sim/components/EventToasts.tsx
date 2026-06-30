"use client";
import { memo } from "react";

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
