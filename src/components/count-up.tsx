import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/trade-utils";

export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 900,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const [n, setN] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number.isFinite(value) ? value : 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className="num">
      {formatNumber(n, decimals)}
      {suffix}
    </span>
  );
}
