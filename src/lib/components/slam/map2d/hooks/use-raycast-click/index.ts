import { onMount } from 'svelte';
import { useThrelte } from '@threlte/core';
import { Plane, Raycaster, Vector2, Vector3 } from 'three';

import { normalizeDeviceCoordinates } from './normalize-device-coordinates';

const EPSILON = 0.001;

/**
 * Fires when the user clicks on the canvas, and reports
 * the intersection of a ray cast from the mouse coordinate
 * to an infinite xy plane at z=0.
 */
type ClickHandler = (value: Vector3) => void;

export const useRaycastClick = (onClick: ClickHandler) => {
	const { renderer, camera } = useThrelte();
	const canvas = renderer.domElement;
	const raycaster = new Raycaster();
	const pointerDown = new Vector2();
	const pointerUp = new Vector2();
	const plane = new Plane();
	plane.normal.set(0, 0, -1);

	const handleDown = (event: PointerEvent) => {
		normalizeDeviceCoordinates(canvas, event.clientX, event.clientY, pointerDown);
	};

	const handleUp = (event: MouseEvent) => {
		normalizeDeviceCoordinates(canvas, event.clientX, event.clientY, pointerUp);

		const pointerMoved = pointerDown.sub(pointerUp).lengthSq() > EPSILON;

		if (pointerMoved) {
			return;
		}

		const vec3 = new Vector3();

		raycaster.setFromCamera(pointerUp, camera.current);
		raycaster.ray.intersectPlane(plane, vec3);

		onClick(vec3);
	};

	onMount(() => {
		canvas.addEventListener('pointerdown', handleDown);
		canvas.addEventListener('click', handleUp);

		return () => {
			canvas.removeEventListener('pointerdown', handleDown);
			canvas.removeEventListener('click', handleUp);
		};
	});
};
