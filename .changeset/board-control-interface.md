---
'@viamrobotics/test-widgets': minor
---

Add `BoardControls`, registered as board's `controls` entry. It lists named pins, analog readers, and digital interrupts, then a Power mode row. Names are kept per board. The optional `analogReaders` and `digitalInterrupts` props seed their lists when none are stored. A write in flight on one pin never blocks another pin. Offline deep power mode arms on the first press and sends on the second. The pins surface is `BoardPinsControl`, registered as board's `pins` entry.
