import { theme } from '@viamrobotics/prime-core/theme';

export const getColor = (hoveredLabel: string | null, label: string): string => {
	if (hoveredLabel === label) {
		return theme.extend.colors['solar-power'];
	} else if (label.includes('transient')) {
		return theme.extend.colors.hologram;
	}

	return theme.extend.colors.cyberpunk;
};
