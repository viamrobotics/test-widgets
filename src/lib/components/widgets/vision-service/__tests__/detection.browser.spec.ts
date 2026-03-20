import { describe, expect, it } from 'vitest';

import { createDetectionContext } from '../context.svelte.ts';
import { detection } from './__fixtures__/detections.ts';

describe('createDetectionContext', () => {
	it('adds a unique id to each detection', () => {
		const context = createDetectionContext(() => [{ ...detection }, { ...detection }]);

		const [detection1, detection2] = context.current;
		expect(detection1?.id).toBeDefined();
		expect(detection2?.id).toBeDefined();
		expect(detection1?.id).not.toEqual(detection2?.id);
	});

	it('adds a color based on label', () => {
		const context = createDetectionContext(() => [
			detection,
			detection,
			{ ...detection, className: 'Matsutake' }
		]);

		const [detection1, detection2, detection3] = context.current;

		// First ensure we've generated hex colors
		expect(detection1?.color).toHaveLength(7);
		expect(detection2?.color).toHaveLength(7);
		expect(detection3?.color).toHaveLength(7);

		expect(detection1?.color).toBe(detection2?.color);
		expect(detection1?.color).not.toBe(detection3?.color);
	});

	it('categorizes detections based on label', () => {
		const context = createDetectionContext(() => [
			detection,
			{ ...detection, className: 'Matsutake' }
		]);

		const [detection1, detection2] = context.current;
		const { Wagyu, Matsutake } = context.byLabel;

		expect(detection1?.id).toBe(Wagyu?.detections[0]?.id);
		expect(detection2?.id).toBe(Matsutake?.detections[0]?.id);

		expect(detection1?.color).toBe(Wagyu?.color);
		expect(detection2?.color).toBe(Matsutake?.color);
	});
});
