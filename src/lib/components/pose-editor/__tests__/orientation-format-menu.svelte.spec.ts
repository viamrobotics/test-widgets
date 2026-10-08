import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AngleUnit, OrientationFormat } from '../orientation-format'

import Host from './__fixtures__/orientation-format-menu-host.svelte'

describe('OrientationFormatMenu', () => {
	const renderSubject = (props: { format?: OrientationFormat; unit?: AngleUnit } = {}) => {
		const boundFormats = vi.fn()
		const boundUnits = vi.fn()
		render(Host, {
			initialFormat: props.format ?? 'vector',
			initialUnit: props.unit ?? 'deg',
			onFormatChange: boundFormats,
			onUnitChange: boundUnits,
		})
		return { boundFormats, boundUnits }
	}

	const menuButton = (name: string) => screen.getByRole('button', { name })
	const item = (name: string) => screen.findByRole('menuitemradio', { name })

	const openMenu = async (props: Parameters<typeof renderSubject>[0] = {}) => {
		const callbacks = renderSubject(props)
		await userEvent.click(screen.getByRole('button'))
		await screen.findByRole('menu')
		return callbacks
	}

	it('names the button after the format and unit', () => {
		renderSubject()
		expect(menuButton('Orientation · Vector · deg')).toBeInTheDocument()
	})

	it('names the button after the other format and unit', () => {
		renderSubject({ format: 'euler', unit: 'rad' })
		expect(menuButton('Orientation · Euler · rad')).toBeInTheDocument()
	})

	it('shows four radio items on open', async () => {
		await openMenu()
		expect(screen.getAllByRole('menuitemradio').map((el) => el.textContent.trim())).toEqual([
			'Vector',
			'Euler',
			'Degrees',
			'Radians',
		])
	})

	it('checks only the current format and unit', async () => {
		await openMenu()
		expect(
			screen
				.getAllByRole('menuitemradio')
				.filter((el) => el.getAttribute('aria-checked') === 'true')
				.map((el) => el.textContent.trim())
		).toEqual(['Vector', 'Degrees'])
	})

	it('focuses the vector item on open', async () => {
		await openMenu()
		await expect.element(await item('Vector')).toHaveFocus()
	})

	it('focuses the euler item on open when the format is euler', async () => {
		await openMenu({ format: 'euler' })
		await expect.element(await item('Euler')).toHaveFocus()
	})

	it('wraps ArrowDown from Radians to Vector', async () => {
		await openMenu()
		const radians = await item('Radians')
		radians.focus()
		await userEvent.keyboard('{ArrowDown}')
		expect(await item('Vector')).toHaveFocus()
	})

	it('wraps ArrowUp from Vector to Radians', async () => {
		await openMenu()
		await userEvent.keyboard('{ArrowUp}')
		expect(await item('Radians')).toHaveFocus()
	})

	it('updates the bound format to euler, closes, and focuses the button when Euler is chosen', async () => {
		const { boundFormats } = await openMenu()
		await userEvent.click(await item('Euler'))
		expect(boundFormats).toHaveBeenCalledWith('euler')
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
		expect(menuButton('Orientation · Euler · deg')).toHaveFocus()
	})

	it('updates the bound unit to rad when Radians is chosen', async () => {
		const { boundUnits } = await openMenu()
		await userEvent.click(await item('Radians'))
		expect(boundUnits).toHaveBeenCalledWith('rad')
	})

	it('closes on Escape and focuses the button', async () => {
		await openMenu()
		await userEvent.keyboard('{Escape}')
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
		expect(menuButton('Orientation · Vector · deg')).toHaveFocus()
	})

	it('does not open on focus alone', () => {
		renderSubject()
		menuButton('Orientation · Vector · deg').focus()
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
	})
})
