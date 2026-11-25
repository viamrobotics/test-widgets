import { themeColor } from '@viamrobotics/tailwind-config/theme-color'

// The map meshes and the legend swatches share these tokens, so each swatch matches its mesh.
const getColorVariable = (hoveredLabel: string | null, label: string) => {
	if (hoveredLabel === label) {
		return '--color-solar-power-bright'
	} else if (label.includes('transient')) {
		return '--color-hologram-bright'
	}

	return '--color-cyberpunk-bright'
}

/** The resolved color, for a three.js material. Undefined when the token is unset, which leaves the material's default. */
export const getColor = (hoveredLabel: string | null, label: string): string | undefined =>
	themeColor(getColorVariable(hoveredLabel, label))

/** A `var(--color-...)` reference, for an inline CSS style. */
export const getCssColor = (hoveredLabel: string | null, label: string): string =>
	`var(${getColorVariable(hoveredLabel, label)})`
