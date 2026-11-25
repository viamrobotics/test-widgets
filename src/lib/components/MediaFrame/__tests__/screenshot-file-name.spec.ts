import { describe, expect, it } from 'vitest'

import { screenshotFileName } from '../screenshot-file-name'

const CAPTURED_AT = new Date('2026-11-19T12:30:45.123Z')

describe('screenshotFileName', () => {
	it('names the file by label and ISO time, with dashes for colons', () => {
		expect(screenshotFileName('camera-1', 'image/png', CAPTURED_AT)).toBe(
			'camera-1-2026-11-19T12-30-45.123Z.png'
		)
	})

	it.each([
		['image/jpeg', 'jpg'],
		['image/png', 'png'],
		['pointcloud/pcd', 'pcd'],
		['image/vnd.viam.dep', 'bin'],
		['', 'bin'],
	])('takes the extension for %j as %s', (mimeType, extension) => {
		expect(screenshotFileName('camera-1', mimeType, CAPTURED_AT)).toBe(
			`camera-1-2026-11-19T12-30-45.123Z.${extension}`
		)
	})
})
