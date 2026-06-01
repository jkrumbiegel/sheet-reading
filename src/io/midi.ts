export type MidiStatus =
  | { kind: "unsupported" }
  | { kind: "denied" }
  | { kind: "ready"; devices: string[] };

const NOTE_ON = 0x90;

/**
 * Subscribe to Note-On messages from all MIDI inputs. Resolves with a disposer;
 * `onStatus` reports device availability for the UI. Safe to call in browsers
 * without Web MIDI — it simply reports "unsupported".
 */
export async function listenMidi(
  onNote: (midi: number) => void,
  onStatus: (status: MidiStatus) => void,
): Promise<() => void> {
  const nav = navigator as Navigator & {
    requestMIDIAccess?: () => Promise<MIDIAccess>;
  };
  if (!nav.requestMIDIAccess) {
    onStatus({ kind: "unsupported" });
    return () => {};
  }

  let access: MIDIAccess;
  try {
    access = await nav.requestMIDIAccess();
  } catch {
    onStatus({ kind: "denied" });
    return () => {};
  }

  const handler = (event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 3) return;
    const [status, note, velocity] = data;
    if ((status! & 0xf0) === NOTE_ON && velocity! > 0) onNote(note!);
  };

  const attach = () => {
    const devices: string[] = [];
    access.inputs.forEach((input) => {
      input.onmidimessage = handler;
      devices.push(input.name ?? "MIDI input");
    });
    onStatus({ kind: "ready", devices });
  };

  attach();
  access.onstatechange = attach;

  return () => {
    access.inputs.forEach((input) => (input.onmidimessage = null));
    access.onstatechange = null;
  };
}
