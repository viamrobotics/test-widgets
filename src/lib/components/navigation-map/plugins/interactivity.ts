import { useThrelte } from '@threlte/core';
import { interactivity } from '@threlte/extras';

import { useMapLibre, useMapLibreThreeRaycast } from '../../maplibre';
/**
 * Provides interactivity as described in @threlte/extras,
 * but carries out necessary camera and screen-space transforms
 * to be compatible with the map camera.
 */
export const interactivityPlugin = () => {
	const { camera } = useThrelte();
	const { map } = useMapLibre();
	const { pointer, compute } = useMapLibreThreeRaycast(camera);

	interactivity({
		target: map.getCanvas(),
		filter: (hits) => {
			// Only return the first hit
			return hits.slice(0, 1);
		},
		compute: (_, state) => {
			state.pointer.update((vec2) => {
				vec2.copy(pointer);
				return vec2;
			});

			compute(state.raycaster);
		}
	});
};
