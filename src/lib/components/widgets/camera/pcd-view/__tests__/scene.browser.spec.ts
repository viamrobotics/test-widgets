import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@threlte/test';
import type { Points, PointsMaterial, Vector3Tuple } from 'three';

import Subject from '../scene.svelte';
import { pcd } from './__fixtures__/pcd.ts';

describe('<Scene>', () => {
	const data = new TextEncoder().encode(pcd);

	beforeEach(() => cleanup());

	it('parses a PCD file and renders a THREE.Points instance with correct point size', () => {
		const pointSize = 0.1;

		const { scene } = render(Subject, {
			data,
			up: [0, 0, 1],
			pointSize
		});

		const points = scene.getObjectByProperty('isPoints', true) as Points;
		expect(points).toBeDefined();
		expect((points.material as PointsMaterial).size).toBe(pointSize);
		expect(points.geometry.getAttribute('position').array).toEqual(new Float32Array([1, 2, 3]));
	});

	it('sets the camera up direction to the world up', () => {
		const up: Vector3Tuple = [0, 0, 1];

		const { camera } = render(Subject, {
			data,
			up,
			pointSize: 0.1
		});

		expect(camera.current.up.toArray()).toEqual(up);
	});
});
