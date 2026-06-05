import type { XmpJson } from './get-xmp-json-from-image'

const TAU = Math.PI * 2

/**
 * Angular extent of a (partial) sphere, in Three.js `SphereGeometry` terms. The
 * `kind` discriminator records which metadata form produced it so the UI can pick
 * a matching label; the renderer only consumes the angles.
 */
export interface PanoCoverage {
	kind: 'equirectangular' | 'gpano'
	/** Azimuth (longitude) start, radians. */
	phiStart: number
	/** Azimuth span, radians (full sphere = 2π). */
	phiLength: number
	/** Polar start from the +Y north pole, radians. */
	thetaStart: number
	/** Polar span, radians (full sphere = π). */
	thetaLength: number
}

const FULL_ANGLES = {
	phiStart: 0,
	phiLength: TAU,
	thetaStart: 0,
	thetaLength: Math.PI,
}

/**
 * Resolve how an image's pixels map onto a viewing sphere from its XMP metadata.
 *
 * - `viam:equirectangular="true"` → a full 360°×180° sphere.
 * - `GPano:ProjectionType="equirectangular"` → the cropped sub-rectangle described
 *   by the GPano `FullPano*`/`CroppedArea*` pixel fields, mapped to a partial sphere
 *   (e.g. an equatorial band with empty poles). Malformed/zero fields fall back to
 *   a full sphere rather than producing NaN geometry.
 *
 * @param xmp - Parsed XMP attributes, or `null` when the image has none.
 * @returns The sphere coverage, or `null` if the image is not a sphere-displayable
 *   equirectangular panorama.
 */
export const getPanoCoverageFromXmp = (xmp: XmpJson | null): PanoCoverage | null => {
	if (!xmp) {
		return null
	}

	if (xmp['viam:equirectangular'] === 'true') {
		return { kind: 'equirectangular', ...FULL_ANGLES }
	}

	if (xmp['GPano:ProjectionType'] !== 'equirectangular') {
		return null
	}

	const num = (key: string): number => Number(xmp[key])
	const fullWidth = num('GPano:FullPanoWidthPixels')
	const fullHeight = num('GPano:FullPanoHeightPixels')

	// Malformed/zero dims → full sphere rather than NaN geometry.
	if (!(fullWidth > 0) || !(fullHeight > 0)) {
		return { kind: 'gpano', ...FULL_ANGLES }
	}

	const coverage: PanoCoverage = {
		kind: 'gpano',
		phiStart: TAU * (num('GPano:CroppedAreaLeftPixels') / fullWidth),
		phiLength: TAU * (num('GPano:CroppedAreaImageWidthPixels') / fullWidth),
		thetaStart: Math.PI * (num('GPano:CroppedAreaTopPixels') / fullHeight),
		thetaLength: Math.PI * (num('GPano:CroppedAreaImageHeightPixels') / fullHeight),
	}

	// Any non-finite cropped field → full sphere fallback.
	const angles = [coverage.phiStart, coverage.phiLength, coverage.thetaStart, coverage.thetaLength]
	return angles.every((element) => Number.isFinite(element))
		? coverage
		: { kind: 'gpano', ...FULL_ANGLES }
}
