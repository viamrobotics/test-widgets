type ThemeColorVariable =
	| '--color-solar-power-bright'
	| '--color-hologram-bright'
	| '--color-cyberpunk-bright'
	| '--color-power-wire-bright'

/**
 * Reads a `@viamrobotics/tailwind-config` color token at run time, for drawing surfaces that take
 * a color string rather than a class: three.js materials and maplibre's SVG marker fill.
 *
 * Pass the full variable name as a literal. Tailwind emits a `@theme` variable only when its full
 * name appears in scanned source, so a name built from a short token reads empty.
 *
 * Call it from component code or inside a function body, never at module top level, so importing
 * this module stays safe outside a browser.
 *
 * @returns The variable's value, or an empty string when the root does not define it. Callers
 * then fall back to their own default color, so a missing token shows without breaking the render.
 */
export const themeColor = (variable: ThemeColorVariable): string =>
	getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
