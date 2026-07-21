/// <reference types="astro/client" />

declare module '*.json' {
  const value: unknown;
  export default value;
}

interface Window {
  cleanPlanetAnalyticsAllowed?: boolean;
  cleanPlanetTrack?: (eventName: string, payload?: Record<string, unknown>) => void;
  ym?: (...args: unknown[]) => void;
}
