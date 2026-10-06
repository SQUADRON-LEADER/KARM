import { useEffect, useState } from "react";

/** Simulates a short async fetch so pages show skeletons briefly on entry. */
export function useSimulatedLoad(ms = 420) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}
