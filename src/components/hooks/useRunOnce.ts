import { useEffect, useRef } from "react";

export function useRunOnce(
  callback: () => void,
  dependencies: React.DependencyList,
) {
  const hasRun = useRef(false);
  if (!hasRun.current) {
    callback();
    hasRun.current = true;
  }
  useEffect(callback, dependencies);
}
