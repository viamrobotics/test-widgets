import type { Classification } from '@viamrobotics/sdk';

export const classifications = [
	{ className: 'dog', confidence: 0.5 },
	{ className: 'dragon', confidence: 0.4 },
	{ className: 'liopleurodon', confidence: 0.1 }
] as const satisfies Classification[];
