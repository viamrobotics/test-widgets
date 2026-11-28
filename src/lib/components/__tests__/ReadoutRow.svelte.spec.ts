import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from '../ReadoutRow.svelte'

const rowText = (name: string) =>
	screen.getByRole('group', { name }).textContent.replaceAll(/\s+/gu, ' ').trim()

describe('ReadoutRow', () => {
	it('names the readout by its label and draws the unit after the value', () => {
		render(Subject, { props: { label: 'Sample rate', value: '48000', suffix: 'Hz' } })

		expect(rowText('Sample rate')).toBe('48000 Hz')
	})

	it('draws a dash and no unit while there is no value', () => {
		render(Subject, { props: { label: 'Sample rate', value: undefined, suffix: 'Hz' } })

		expect(rowText('Sample rate')).toBe('-')
	})

	it('draws a value alone when it has no unit', () => {
		render(Subject, { props: { label: 'Channels', value: '2' } })

		expect(rowText('Channels')).toBe('2')
	})
})
