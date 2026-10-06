import { Quaternion } from 'three'
import { describe, expect, it } from 'vitest'

import type { OrientationVector } from '$lib/orientation-vector-quaternion'

import {
	orientationVectorToQuaternion,
	quaternionToOrientationVector,
} from '$lib/orientation-vector-quaternion'

const PRECISION = 8

type QuaternionComponents = [x: number, y: number, z: number, w: number]

describe('orientationVectorToQuaternion', () => {
	describe('against rdk orientation_vector_golden.json fromVector', () => {
		it.each<[string, OrientationVector, QuaternionComponents]>([
			[
				'45 degrees about x, from testCompatibility',
				{ oX: 0, oY: -0.7071067811865476, oZ: 0.7071067811865476, theta: 90 },
				[0.3826834323650898, 7.916173364662557e-17, -1.5187797984739997e-17, 0.9238795325112867],
			],
			[
				'inside the pole radius with a longitude, from TestOrientationVectorPoleRadius',
				{ oX: 0.0050164674, oY: 0.0079070413, oZ: 0.9999561559, theta: 90.2029644505 },
				[0.003316602089147981, 0.003304874125080605, 0.7083503338102608, 0.70584550898089],
			],
			[
				'about +X, from TestQuatConversion',
				{ oX: 1, oY: 0, oZ: 0, theta: 141.639750618701 },
				[0.6678555622436378, 0.23231217785607847, 0.667855562243638, 0.23231217785607852],
			],
			[
				'about -X, from TestQuatConversion',
				{ oX: -1, oY: 0, oZ: 0, theta: 141.639750618701 },
				[-0.23231217785607844, 0.667855562243638, 0.23231217785607855, -0.667855562243638],
			],
			[
				'about +Y, from TestQuatConversion',
				{ oX: 0, oY: 1, oZ: 0, theta: 141.639750618701 },
				[0.3079756806013824, 0.6365147132298791, 0.6365147132298793, -0.30797568060138236],
			],
			[
				'about -Y, from TestQuatConversion',
				{ oX: 0, oY: -1, oZ: 0, theta: 141.639750618701 },
				[0.6365147132298792, -0.30797568060138225, 0.3079756806013825, 0.6365147132298792],
			],
			[
				'at a small angle that once tripped the pole epsilon, from TestQuatConversion',
				{
					oX: 0.5048437942940054,
					oY: 0.5889844266763397,
					oZ: 0.631054742867507,
					theta: 1.145915590262,
				},
				[-0.1755596602541314, 0.3919839719397981, 0.38553754851640015, 0.8166322122704431],
			],
			[
				'that once gave trouble, at theta zero, from TestQuatConversion',
				{ oX: -0.32439089809469324, oY: -0.9441256803955101, oZ: -0.05828588895294498, theta: 0 },
				[0.5920660484957303, 0.42261180614734833, -0.5585064512291035, 0.3986572455869837],
			],
			[
				'that once gave trouble, rotated, from TestQuatConversion',
				{
					oX: -0.32439089809469324,
					oY: -0.9441256803955101,
					oZ: -0.05828588895294498,
					theta: -32.842873631968,
				},
				[0.44844214211454825, 0.5727500237033498, -0.6484245535282075, 0.22450535384545364],
			],
			[
				'at the north pole, rotated, from TestOVConversionPoles',
				{ oX: 0, oY: 0, oZ: 1, theta: 141.639750618701 },
				[0, 0, 0.9444903938312615, 0.3285390326284968],
			],
			[
				'at the north pole, unrotated, from TestOVConversionPoles',
				{ oX: 0, oY: 0, oZ: 1, theta: 0 },
				[0, 0, 0, 1],
			],
			[
				'at the north pole, rotated the other way, from TestOVConversionPoles',
				{ oX: 0, oY: 0, oZ: 1, theta: -141.639750618701 },
				[0, 0, -0.9444903938312615, 0.3285390326284968],
			],
			[
				'at the north pole, rotated under a radian, from TestOVConversionPoles',
				{ oX: 0, oY: 0, oZ: 1, theta: -44.690708020204 },
				[0, 0, -0.3801884151231614, 0.9249090598573131],
			],
			[
				'at the south pole, rotated, from TestOVConversionPoles',
				{ oX: 0, oY: 0, oZ: -1, theta: 141.639750618701 },
				[0.9444903938312615, 0.3285390326284968, 5.783335688154379e-17, 2.0117213735172796e-17],
			],
			[
				'at the south pole, unrotated, from TestOVConversionPoles',
				{ oX: 0, oY: 0, oZ: -1, theta: 0 },
				[0, 1, 0, 6.123233995736757e-17],
			],
			[
				'at the south pole, rotated the other way, from TestOVConversionPoles',
				{ oX: 0, oY: 0, oZ: -1, theta: -141.639750618701 },
				[-0.9444903938312615, 0.3285390326284968, -5.783335688154379e-17, 2.0117213735172796e-17],
			],
			[
				'at the south pole, rotated under a radian, from TestOVConversionPoles',
				{ oX: 0, oY: 0, oZ: -1, theta: -44.690708020204 },
				[-0.3801884151231614, 0.9249090598573131, -2.327982628267421e-17, 5.663434598283223e-17],
			],
			[
				'with a vector 999 long, from TestOVNormalize',
				{ oX: 999, oY: 0, oZ: 0, theta: 0 },
				[0, 0.7071067811865475, 0, 0.7071067811865476],
			],
			[
				'with a vector half a unit long, from TestOVNormalize',
				{ oX: 0.5, oY: 0, oZ: 0, theta: 0 },
				[0, 0.7071067811865475, 0, 0.7071067811865476],
			],
			[
				'left entirely unset, from TestQuatDefault',
				{ oX: 0, oY: 0, oZ: 0, theta: 0 },
				[0, 0, 0, 1],
			],
		])('%s', (_name, orientation, [x, y, z, w]) => {
			const dest = new Quaternion()
			const result = orientationVectorToQuaternion(orientation, dest)

			expect(result).toBe(dest)
			expect(result.x, 'x vs rdk').toBeCloseTo(x, PRECISION)
			expect(result.y, 'y vs rdk').toBeCloseTo(y, PRECISION)
			expect(result.z, 'z vs rdk').toBeCloseTo(z, PRECISION)
			expect(result.w, 'w vs rdk').toBeCloseTo(w, PRECISION)
		})
	})

	describe('poles and degenerate directions', () => {
		it.each<[string, OrientationVector, QuaternionComponents]>([
			[
				'+Z pole at 90 degrees',
				{ oX: 0, oY: 0, oZ: 1, theta: 90 },
				[0, 0, Math.SQRT1_2, Math.SQRT1_2],
			],
			['-Z pole at 0 degrees', { oX: 0, oY: 0, oZ: -1, theta: 0 }, [0, 1, 0, 0]],
			[
				'zero-length direction reads as +Z',
				{ oX: 0, oY: 0, oZ: 0, theta: 90 },
				[0, 0, Math.SQRT1_2, Math.SQRT1_2],
			],
		])('%s', (_name, orientation, [x, y, z, w]) => {
			const result = orientationVectorToQuaternion(orientation, new Quaternion())

			expect(result.x).toBeCloseTo(x, PRECISION)
			expect(result.y).toBeCloseTo(y, PRECISION)
			expect(result.z).toBeCloseTo(z, PRECISION)
			expect(result.w).toBeCloseTo(w, PRECISION)
		})
	})
})

describe('quaternionToOrientationVector', () => {
	describe('against rdk orientation_vector_golden.json fromQuaternion', () => {
		it.each<[string, QuaternionComponents, OrientationVector]>([
			[
				'a 45 degree turn about x, from testCompatibility',
				[0.3826834323650898, 0, 0, 0.9238795325112867],
				{ oX: 0, oY: -0.7071067811865476, oZ: 0.7071067811865475, theta: 90 },
			],
			['identity, from rmQuatSamples', [0, 0, 0, 1], { oX: 0, oY: 0, oZ: 1, theta: 0 }],
			[
				'x90, from rmQuatSamples',
				[0.7071067811865476, 0, 0, 0.7071067811865476],
				{ oX: 0, oY: -1.0000000000000002, oZ: -4.266421588589642e-17, theta: 90 },
			],
			[
				'y90, from rmQuatSamples',
				[0, 0.7071067811865476, 0, 0.7071067811865476],
				{ oX: 1.0000000000000002, oY: 0, oZ: -4.266421588589642e-17, theta: 0 },
			],
			[
				'z90, from rmQuatSamples',
				[0, 0, 0.7071067811865476, 0.7071067811865476],
				{ oX: 0, oY: 0, oZ: 1.0000000000000002, theta: 90 },
			],
			['z180, from rmQuatSamples', [0, 0, 1, 0], { oX: 0, oY: 0, oZ: 1, theta: -180 }],
			[
				'zyx_30_45_60, from rmQuatSamples',
				[0.022260026714733816, 0.43967973954090955, 0.36042340565035597, 0.8223631719059993],
				{
					oX: 0.7391989197401165,
					oY: 0.2803300858899107,
					oZ: 0.6123724356957945,
					theta: 26.565051177078,
				},
			],
			[
				'a quarter turn about -X, from TestQuatConversion',
				[-0.7071067811865476, 0, 0, 0.7071067811865476],
				{ oX: 0, oY: 1.0000000000000002, oZ: -4.266421588589642e-17, theta: -90 },
			],
			[
				'about -Y, from TestQuatConversion',
				[0, -0.28, 0, 0.96],
				{ oX: -0.5376000000000001, oY: 0, oZ: 0.8432, theta: -180 },
			],
			[
				'about -Z, from TestQuatConversion',
				[0, 0, -0.28, 0.96],
				{ oX: 0, oY: 0, oZ: 0.9999999999999999, theta: -32.520409416624 },
			],
			[
				'at a negative theta, from TestQuatConversion',
				[-0.28, 0, 0, 0.96],
				{ oX: 0, oY: 0.5376000000000001, oZ: 0.8432, theta: -90 },
			],
			[
				'at the complementary angle, from TestQuatConversion',
				[0.28, 0, 0, 0.96],
				{ oX: 0, oY: -0.5376000000000001, oZ: 0.8432, theta: 90 },
			],
			[
				'at an odd angle, from TestQuatConversion',
				[-0.5, -0.5, -0.5, 0.5],
				{ oX: 0, oY: 1, oZ: 0, theta: -180 },
			],
		])('%s', (_name, [x, y, z, w], expected) => {
			const result = quaternionToOrientationVector(new Quaternion(x, y, z, w))

			expect(result.oX, 'oX vs rdk').toBeCloseTo(expected.oX, PRECISION)
			expect(result.oY, 'oY vs rdk').toBeCloseTo(expected.oY, PRECISION)
			expect(result.oZ, 'oZ vs rdk').toBeCloseTo(expected.oZ, PRECISION)
			expect(result.theta, 'theta vs rdk').toBeCloseTo(expected.theta, PRECISION)
		})
	})

	it('never returns a negative zero theta', () => {
		const result = quaternionToOrientationVector(new Quaternion(0, 0, 0, 1))

		expect(Object.is(result.theta, 0)).toBe(true)
	})

	it('reads a +Z pole rotation as theta in degrees', () => {
		const result = quaternionToOrientationVector(new Quaternion(0, 0, Math.SQRT1_2, Math.SQRT1_2))

		expect(result.oZ).toBeCloseTo(1, PRECISION)
		expect(result.theta).toBeCloseTo(90, PRECISION)
	})

	it('reads a -Z pole rotation', () => {
		const result = quaternionToOrientationVector(new Quaternion(0, 1, 0, 0))

		expect(result.oZ).toBeCloseTo(-1, PRECISION)
		expect(result.theta).toBeCloseTo(0, PRECISION)
	})
})
