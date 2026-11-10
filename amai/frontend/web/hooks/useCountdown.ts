"use client";

import { useEffect, useState } from "react";

import { SITE } from "@/config/urls";

export interface CountdownValues {
  d: string;
  h: string;
  m: string;
  s: string;
}

const PLACEHOLDER: CountdownValues = { d: "--", h: "--", m: "--", s: "--" };
const pad = (n: number) => String(n).padStart(2, "0");

function compute(target: number): CountdownValues {
  const t = Math.max(0, target - Date.now());
  return {
    d: String(Math.floor(t / 864e5)),
    h: pad(Math.floor((t % 864e5) / 36e5)),
    m: pad(Math.floor((t % 36e5) / 6e4)),
    s: pad(Math.floor((t % 6e4) / 1e3)),
  };
}

/** Counts down to the conference start. Renders "--" until mounted so SSR and hydration match. */
export function useCountdown(): CountdownValues {
  const [values, setValues] = useState<CountdownValues>(PLACEHOLDER);

  useEffect(() => {
    const target = new Date(SITE.conferenceStart).getTime();
    const tick = () => setValues(compute(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return values;
}
