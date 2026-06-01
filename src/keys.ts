import type { Scale } from "./domain/scale";

export interface KeyOption {
  label: string;
  scale: Scale;
}

export const KEY_OPTIONS: KeyOption[] = [
  { label: "C major", scale: { tonic: { step: "C", alter: 0 }, mode: "major" } },
  { label: "G major", scale: { tonic: { step: "G", alter: 0 }, mode: "major" } },
  { label: "D major", scale: { tonic: { step: "D", alter: 0 }, mode: "major" } },
  { label: "A major", scale: { tonic: { step: "A", alter: 0 }, mode: "major" } },
  { label: "E major", scale: { tonic: { step: "E", alter: 0 }, mode: "major" } },
  { label: "B major", scale: { tonic: { step: "B", alter: 0 }, mode: "major" } },
  { label: "F# major", scale: { tonic: { step: "F", alter: 1 }, mode: "major" } },
  { label: "F major", scale: { tonic: { step: "F", alter: 0 }, mode: "major" } },
  { label: "Bb major", scale: { tonic: { step: "B", alter: -1 }, mode: "major" } },
  { label: "Eb major", scale: { tonic: { step: "E", alter: -1 }, mode: "major" } },
  { label: "Ab major", scale: { tonic: { step: "A", alter: -1 }, mode: "major" } },
  { label: "Db major", scale: { tonic: { step: "D", alter: -1 }, mode: "major" } },
];
