import { Detection } from '@viamrobotics/sdk';

export const detection: Detection = new Detection({
	xMin: 5n,
	yMin: 5n,
	xMax: 10n,
	yMax: 10n,
	confidence: 0.5,
	className: 'Wagyu'
});
