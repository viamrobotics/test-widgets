import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@threlte/test';

import { createDetectionContext, DETECTIONS_CONTEXT_KEY } from '../context.svelte.ts';
import Subject from '../scene.svelte';
import { detection } from './__fixtures__/detections.ts';

describe('<Scene>', () => {
	beforeEach(() => cleanup());

	it('renders a bounding box representing a detection', () => {
		const context = createDetectionContext(() => [detection]);

		// @ts-expect-error Remove once @threlte/test updates
		const { scene } = render(Subject, {
			context: new Map([[DETECTIONS_CONTEXT_KEY, context]]),
			props: {
				img: new Image()
			}
		});

		const selector = `Detection ${context.current[0]?.id ?? ''}`;
		const boundingBox = scene.getObjectByName(selector);
		expect(boundingBox).toBeDefined();
	});
});
