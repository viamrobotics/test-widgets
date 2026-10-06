import { render } from '@testing-library/svelte'
import { robotApi } from '@viamrobotics/sdk'
import { beforeEach, describe, expect, it } from 'vitest'

import type { NamedResourceStatus } from '$lib/resource'

import { getResourceKey } from '$lib/get-resource-key'

import Subject, { collapseAll } from '../card-list-item.svelte'

const PART_ID = 'part-id'

const buildResource = (name: string): NamedResourceStatus => ({
	name: {
		namespace: 'rdk',
		type: 'component',
		subtype: 'camera',
		name,
	},
	state: robotApi.ResourceStatus_State.CONFIGURING,
	revision: '1',
	error: '',
})

const collapseKey = (resource: NamedResourceStatus) =>
	`control/${PART_ID}/${getResourceKey(resource.name)}/test/collapse`

describe('CardListItem collapseAll', () => {
	const mountedResource = buildResource('mounted-camera')
	const unmountedResource = buildResource('unmounted-camera')

	beforeEach(() => {
		localStorage.clear()
	})

	it('collapses a mounted item', () => {
		render(Subject, { partID: PART_ID, resource: mountedResource, urlHash: '' })

		collapseAll()

		expect(localStorage.getItem(collapseKey(mountedResource))).toBe('true')
	})

	it('skips an item that has unmounted', () => {
		render(Subject, { partID: PART_ID, resource: mountedResource, urlHash: '' })
		const { unmount } = render(Subject, {
			partID: PART_ID,
			resource: unmountedResource,
			urlHash: '',
		})
		unmount()

		collapseAll()

		expect(localStorage.getItem(collapseKey(unmountedResource))).toBeNull()
	})
})
