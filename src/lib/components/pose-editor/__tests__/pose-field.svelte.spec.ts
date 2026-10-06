import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'

import type { PoseFieldStatus, PoseStatusMessage } from '../pose-field-status'

import Subject from '../pose-field.svelte'
import Host from './__fixtures__/pose-field-host.svelte'

const baseStatus: PoseFieldStatus = {
	current: 412.6,
	isEdited: false,
	drift: undefined,
	isMoving: false,
}

describe('PoseField', () => {
	const renderSubject = (props: Partial<ComponentProps<typeof Subject>> = {}) =>
		render(Subject, {
			id: 'pose-x',
			label: 'X',
			unit: 'mm',
			value: 400,
			step: 0.1,
			...props,
		})

	const restoreButton = () => screen.getByRole('button')
	const input = (name: string | RegExp = /X/u) => screen.getByRole('spinbutton', { name })

	it('names the restore button after the current value', () => {
		renderSubject({ status: baseStatus })
		expect(
			screen.getByRole('button', { name: 'Reset X to its current value, 412.6' })
		).toHaveTextContent('412.6')
	})

	it('calls onReset when the restore button is clicked', async () => {
		const onReset = vi.fn()
		renderSubject({ status: baseStatus, onreset: onReset })
		await userEvent.click(restoreButton())
		expect(onReset).toHaveBeenCalledOnce()
	})

	it.each([
		{ isEdited: false, tabIndex: -1 },
		{ isEdited: true, tabIndex: 0 },
	])('sets restore tabIndex $tabIndex when isEdited is $isEdited', ({ isEdited, tabIndex }) => {
		renderSubject({ status: { ...baseStatus, isEdited } })
		expect(restoreButton().tabIndex).toBe(tabIndex)
	})

	it('describes drift on the input', () => {
		renderSubject({ status: { ...baseStatus, isEdited: true, drift: 12 } })
		expect(input()).toHaveAccessibleDescription(
			expect.stringContaining('Moved 12.00 mm since you edited X.')
		)
	})

	it('announces the current value and drift message once', () => {
		renderSubject({ status: { ...baseStatus, isEdited: true, drift: 12 } })
		expect(input()).toHaveAccessibleDescription('Current 412.6. Moved 12.00 mm since you edited X.')
	})

	it('describes an edit kept while moving', () => {
		renderSubject({ status: { ...baseStatus, isEdited: true, isMoving: true } })
		expect(input()).toHaveAccessibleDescription(
			expect.stringContaining('Moving. Your edit is kept.')
		)
	})

	it('renders no button and no description without status', () => {
		renderSubject()
		expect(screen.queryByRole('button')).toBeNull()
		expect(input()).toHaveAccessibleDescription('')
	})

	it('rounds the shown value to the step decimals', () => {
		renderSubject({ value: 412.64 })
		expect(input()).toHaveValue(412.6)
	})

	it('names the input with the label suffix and keeps the restore name plain', () => {
		renderSubject({ label: 'θ', details: 'deg', status: baseStatus })
		expect(input('θ (deg)')).toBeInTheDocument()
		expect(restoreButton()).toHaveAccessibleName('Reset θ to its current value, 412.6')
	})

	it('binds a typed value', async () => {
		const onChange = vi.fn()
		render(Host, { id: 'pose-x', label: 'X', step: 0.1, value: 400, onChange })

		await userEvent.clear(input())
		await userEvent.type(input(), '5')
		await userEvent.tab()

		expect(onChange).toHaveBeenLastCalledWith(5)
	})

	it('writes a handle drag through the bound value', async () => {
		const onChange = vi.fn()
		vi.spyOn(HTMLElement.prototype, 'setPointerCapture').mockImplementation(() => undefined)
		render(Host, { id: 'pose-x', label: 'X', step: 0.1, value: 400, onChange })
		const handle = screen.getByRole('button', { hidden: true })

		await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0 })
		await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 50 })

		expect(onChange).toHaveBeenLastCalledWith(405)
		vi.restoreAllMocks()
	})

	it('binds 0 when the input is cleared', async () => {
		const onChange = vi.fn()
		render(Host, { id: 'pose-x', label: 'X', step: 0.1, value: 400, onChange })

		await userEvent.clear(input())
		await userEvent.tab()

		expect(onChange).toHaveBeenLastCalledWith(0)
	})

	it('replaces the neutral copy with the statusMessage snippet', () => {
		const statusMessage = createRawSnippet<[PoseStatusMessage]>((details) => ({
			render: () => `<span>The widget drifted ${details().amount}.</span>`,
		}))
		renderSubject({ status: { ...baseStatus, isEdited: true, drift: 12 }, statusMessage })

		expect(input()).toHaveAccessibleDescription('Current 412.6. The widget drifted 12.00 mm.')
	})

	it('hands the snippet the drift kind, label, and amount', () => {
		const received: PoseStatusMessage[] = []
		const statusMessage = createRawSnippet<[PoseStatusMessage]>((details) => {
			received.push(details())
			return { render: () => '<span>x</span>' }
		})
		renderSubject({ status: { ...baseStatus, isEdited: true, drift: 12 }, statusMessage })

		expect(received.at(-1)).toEqual({ kind: 'drift', label: 'X', amount: '12.00 mm' })
	})

	it('hands the snippet the moving kind with an empty amount', () => {
		const received: PoseStatusMessage[] = []
		const statusMessage = createRawSnippet<[PoseStatusMessage]>((details) => {
			received.push(details())
			return { render: () => '<span>x</span>' }
		})
		renderSubject({ status: { ...baseStatus, isEdited: true, isMoving: true }, statusMessage })

		expect(received.at(-1)).toEqual({ kind: 'moving', label: 'X', amount: '' })
	})
})
