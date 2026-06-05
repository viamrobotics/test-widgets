import { describe, expect, it } from 'vitest'

import { getPanoCoverageFromXmp } from '../get-pano-coverage-from-xmp'

describe('getPanoCoverageFromXmp', () => {
	it('returns null when there is no XMP', () => {
		expect(getPanoCoverageFromXmp(null)).toBeNull()
	})

	it('returns null for a non-panorama image', () => {
		expect(getPanoCoverageFromXmp({ 'viam:other': 'true' })).toBeNull()
	})

	it('maps viam:equirectangular to a full sphere', () => {
		expect(getPanoCoverageFromXmp({ 'viam:equirectangular': 'true' })).toEqual({
			kind: 'equirectangular',
			phiStart: 0,
			phiLength: Math.PI * 2,
			thetaStart: 0,
			thetaLength: Math.PI,
		})
	})

	it('maps a GPano equatorial band to a partial sphere (JVCU360 360°×53°)', () => {
		// 1920×190 image inside a full 1920×645 pano, centered vertically (top = 227).
		const coverage = getPanoCoverageFromXmp({
			'GPano:ProjectionType': 'equirectangular',
			'GPano:FullPanoWidthPixels': '1920',
			'GPano:FullPanoHeightPixels': '645',
			'GPano:CroppedAreaImageWidthPixels': '1920',
			'GPano:CroppedAreaImageHeightPixels': '190',
			'GPano:CroppedAreaLeftPixels': '0',
			'GPano:CroppedAreaTopPixels': '227',
		})

		expect(coverage?.kind).toBe('gpano')
		// Full horizontal sweep, no azimuth offset → unchanged longitude.
		expect(coverage?.phiStart).toBe(0)
		expect(coverage?.phiLength).toBeCloseTo(Math.PI * 2)
		// A band around the equator, not stretched pole-to-pole.
		expect(coverage?.thetaStart).toBeCloseTo((Math.PI * 227) / 645)
		expect(coverage?.thetaLength).toBeCloseTo((Math.PI * 190) / 645)
	})

	it('maps a horizontally cropped GPano region', () => {
		const coverage = getPanoCoverageFromXmp({
			'GPano:ProjectionType': 'equirectangular',
			'GPano:FullPanoWidthPixels': '4000',
			'GPano:FullPanoHeightPixels': '2000',
			'GPano:CroppedAreaImageWidthPixels': '1000',
			'GPano:CroppedAreaImageHeightPixels': '500',
			'GPano:CroppedAreaLeftPixels': '1000',
			'GPano:CroppedAreaTopPixels': '750',
		})

		expect(coverage).toEqual({
			kind: 'gpano',
			phiStart: (Math.PI * 2 * 1000) / 4000,
			phiLength: (Math.PI * 2 * 1000) / 4000,
			thetaStart: (Math.PI * 750) / 2000,
			thetaLength: (Math.PI * 500) / 2000,
		})
	})

	it('falls back to a full sphere when cropped area dimensions are zero', () => {
		const fullSphere = {
			kind: 'gpano',
			phiStart: 0,
			phiLength: Math.PI * 2,
			thetaStart: 0,
			thetaLength: Math.PI,
		}

		expect(
			getPanoCoverageFromXmp({
				'GPano:ProjectionType': 'equirectangular',
				'GPano:FullPanoWidthPixels': '1920',
				'GPano:FullPanoHeightPixels': '645',
				'GPano:CroppedAreaImageWidthPixels': '0',
				'GPano:CroppedAreaImageHeightPixels': '190',
				'GPano:CroppedAreaLeftPixels': '0',
				'GPano:CroppedAreaTopPixels': '0',
			})
		).toEqual(fullSphere)

		expect(
			getPanoCoverageFromXmp({
				'GPano:ProjectionType': 'equirectangular',
				'GPano:FullPanoWidthPixels': '1920',
				'GPano:FullPanoHeightPixels': '645',
				'GPano:CroppedAreaImageWidthPixels': '1920',
				'GPano:CroppedAreaImageHeightPixels': '0',
				'GPano:CroppedAreaLeftPixels': '0',
				'GPano:CroppedAreaTopPixels': '0',
			})
		).toEqual(fullSphere)
	})

	it('falls back to a full sphere when GPano dimensions are missing or zero', () => {
		const fullSphere = {
			kind: 'gpano',
			phiStart: 0,
			phiLength: Math.PI * 2,
			thetaStart: 0,
			thetaLength: Math.PI,
		}

		expect(
			getPanoCoverageFromXmp({
				'GPano:ProjectionType': 'equirectangular',
				'GPano:CroppedAreaImageWidthPixels': '1920',
				'GPano:CroppedAreaImageHeightPixels': '190',
			})
		).toEqual(fullSphere)

		expect(
			getPanoCoverageFromXmp({
				'GPano:ProjectionType': 'equirectangular',
				'GPano:FullPanoWidthPixels': '0',
				'GPano:FullPanoHeightPixels': '645',
				'GPano:CroppedAreaImageWidthPixels': '1920',
				'GPano:CroppedAreaImageHeightPixels': '190',
				'GPano:CroppedAreaLeftPixels': '0',
				'GPano:CroppedAreaTopPixels': '227',
			})
		).toEqual(fullSphere)
	})
})
