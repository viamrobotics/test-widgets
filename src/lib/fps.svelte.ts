export const useMeasureFps = (alpha = 0.04) => {
	let smoothedFps = $state(0);

	let then: number | undefined;

	const measure = (now = performance.now()) => {
		if (then !== undefined) {
			const delta = now - then;

			if (delta > 0) {
				const instantFps = 1000 / delta;

				// Apply exponential moving average
				smoothedFps =
					smoothedFps === 0 ? instantFps : smoothedFps * (1 - alpha) + instantFps * alpha;
			}
		}

		then = now;
	};

	return {
		get current() {
			return smoothedFps;
		},
		measure
	};
};
