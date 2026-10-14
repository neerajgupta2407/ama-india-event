"use client";

import { Fragment, useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

function parts(target: number) {
  const t = Math.max(0, target - Date.now());
  return [
    { label: "Days", value: String(Math.floor(t / 864e5)) },
    { label: "Hours", value: pad(Math.floor((t % 864e5) / 36e5)) },
    { label: "Minutes", value: pad(Math.floor((t % 36e5) / 6e4)) },
    { label: "Seconds", value: pad(Math.floor((t % 6e4) / 1e3)) },
  ];
}

// ai_cd: live countdown to the event start. Renders "--" on the server to avoid a hydration mismatch.
export function Countdown({ startsAt }: { startsAt: string }) {
  const target = new Date(startsAt).getTime();
  const [now, setNow] = useState<ReturnType<typeof parts> | null>(null);

  useEffect(() => {
    const tick = () => setNow(parts(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const shown = now ?? parts(0).map((p) => ({ ...p, value: "--" }));
  return (
    <div className="flex flex-wrap gap-4 sm:gap-6" role="timer" aria-label="Time until the conference begins">
      {shown.map((p, i) => (
        <Fragment key={p.label}>
          {i > 0 && <span aria-hidden className="hidden w-px self-stretch bg-line-200 sm:block" />}
          <div className="min-w-[64px] text-center sm:min-w-[76px]">
            <b className="tnum block text-[2rem] leading-none font-extrabold text-brand-blue-600">{p.value}</b>
            <span className="text-[11px] font-bold tracking-[0.1em] text-ink-500 uppercase">{p.label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
