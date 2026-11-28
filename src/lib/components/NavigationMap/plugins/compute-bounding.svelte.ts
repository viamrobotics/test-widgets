import { injectPlugin } from '@threlte/core'
import { omit } from 'lodash-es'
import { BufferGeometry } from 'three'

import { useNavigationMap } from '../use-navigation-map.svelte'

interface Props {
	computeBounding: string
}

export const computeBoundingPlugin = () =>
	injectPlugin<Props>('computeBounding', ({ ref, props }) => {
		const nav = useNavigationMap()

		let currentRef = ref as BufferGeometry
		let currentProps = props

		if (!(currentRef instanceof BufferGeometry) || !currentProps.computeBounding) {
			return
		}

		const handleChange = () => {
			currentRef.computeBoundingSphere()
			const radius = currentRef.boundingSphere?.radius

			if (radius) {
				nav.boundingRadius[currentProps.computeBounding] = radius
			}
		}

		return {
			pluginProps: ['computeBounding'] as const,
			onRefChange(nextRef: BufferGeometry) {
				currentRef = nextRef
				handleChange()

				return () => {
					nav.boundingRadius = omit(nav.boundingRadius, [currentProps.computeBounding])
				}
			},
			onPropsChange(nextProps: Props) {
				currentProps = nextProps
				handleChange()
			},
		}
	})
