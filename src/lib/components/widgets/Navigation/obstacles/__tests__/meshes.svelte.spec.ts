import { cleanup, render } from '@threlte/test'
import { Mesh, MeshPhongMaterial, type Object3D, SphereGeometry } from 'three'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import Subject from '../meshes.svelte'
import { obstacles } from './__fixtures__/obstacles.ts'

const findSphereMaterial = (scene: Object3D) => {
	let material: MeshPhongMaterial | undefined
	scene.traverse((object) => {
		if (
			object instanceof Mesh &&
			object.geometry instanceof SphereGeometry &&
			object.material instanceof MeshPhongMaterial
		) {
			material = object.material
		}
	})
	if (!material) throw new Error('The sphere obstacle rendered no Phong material')
	return material
}

describe('NavigationService obstacle meshes', () => {
	beforeEach(() => {
		cleanup()
		document.documentElement.style.setProperty('--color-solar-power-bright', 'rgb(1, 2, 3)')
		document.documentElement.style.setProperty('--color-cyberpunk-bright', 'rgb(4, 5, 6)')
	})

	afterEach(() => {
		document.documentElement.style.removeProperty('--color-solar-power-bright')
		document.documentElement.style.removeProperty('--color-cyberpunk-bright')
	})

	it("colors a hovered obstacle with the solar-power-bright token's value", () => {
		const { scene } = render(Subject, {
			obstacles,
			hovered: 'sphere',
			setHovered: () => {},
			view: '3D',
		})

		expect(findSphereMaterial(scene).color.getHexString()).toBe('010203')
	})

	it("colors a static obstacle with the cyberpunk-bright token's value", () => {
		const { scene } = render(Subject, {
			obstacles,
			hovered: null,
			setHovered: () => {},
			view: '3D',
		})

		expect(findSphereMaterial(scene).color.getHexString()).toBe('040506')
	})
})
