/**
 * A width class, named for Tailwind's container sizes. The widgets switch layout at exactly these
 * widths through `@xs:` and `@2xl:` container classes, so a class says which layout a host sees.
 */
export type WidthClass = 'xs' | '2xl' | '4xl'

/**
 * A height band. `sm` fits in 120 px, `md` in 240, and `lg` in 480. An `xl` widget is taller, and
 * scrolls inside the box a host gives it.
 */
export type HeightBand = 'sm' | 'md' | 'lg' | 'xl'

/**
 * A widget's layout size, for a host that sizes, snaps, or caps the box it renders in. Each size is
 * the widget's own box, without any header, padding, or border the host draws around it.
 */
export interface WidgetSize {
	width: {
		/** The class floor. Narrower than `WIDTH_CLASS_PX[min]`, the widget overflows. */
		min: WidthClass
		/** Wider than this class, the widget adds only empty space. `fill` takes any width. */
		max: WidthClass | 'fill'
	}
	/** The band the widget's height falls in at its class floor. */
	height: HeightBand
}

/** Each width class in px. */
export const WIDTH_CLASS_PX = { xs: 320, '2xl': 672, '4xl': 896 } as const satisfies Record<
	WidthClass,
	number
>

/** The tallest height in px of each bounded band. `xl` has no bound. */
export const HEIGHT_BAND_PX = { sm: 120, md: 240, lg: 480 } as const satisfies Record<
	Exclude<HeightBand, 'xl'>,
	number
>
