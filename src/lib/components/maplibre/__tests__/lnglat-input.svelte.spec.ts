import '../../../../app.css'

import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../lnglat-input.svelte'

const type = async (name: string, value: string) => {
	const input = screen.getByRole('spinbutton', { name })
	await fireEvent.input(input, { target: { value } })
}

describe('LngLatInput', () => {
	it('calls oninput with the typed latitude and the current longitude', async () => {
		const oninput = vi.fn()
		render(Subject, { props: { lng: 10, lat: 20, oninput } })

		await type('Lat', '45')

		expect(oninput).toHaveBeenCalled()
		const lngLat = oninput.mock.lastCall?.[0]
		expect(lngLat.lat).toBe(45)
		expect(lngLat.lng).toBe(10)
	})

	it('calls oninput with the typed longitude and the current latitude', async () => {
		const oninput = vi.fn()
		render(Subject, { props: { lng: 10, lat: 20, oninput } })

		await type('Lng', '-70')

		const lngLat = oninput.mock.lastCall?.[0]
		expect(lngLat.lng).toBe(-70)
		expect(lngLat.lat).toBe(20)
	})

	it('does not call oninput for an empty field', async () => {
		const oninput = vi.fn()
		render(Subject, { props: { lng: 10, lat: 20, oninput } })

		await type('Lat', '')

		expect(oninput).not.toHaveBeenCalled()
	})

	it('marks both fields readonly when readonly is set', () => {
		render(Subject, { props: { lng: 10, lat: 20, readonly: true, oninput: vi.fn() } })

		expect(screen.getByRole('spinbutton', { name: 'Lat' })).toHaveAttribute('readonly')
		expect(screen.getByRole('spinbutton', { name: 'Lng' })).toHaveAttribute('readonly')
	})
})
