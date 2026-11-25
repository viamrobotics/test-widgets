import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move.svelte'

describe('Motion move', () => {
	let user: ReturnType<typeof userEvent.setup>
	let keySeq = 0

	beforeEach(() => {
		user = userEvent.setup()
		localStorage.clear()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>> = {}) =>
		render(Subject, {
			frameName: 'my-arm',
			destination: 'world',
			isPending: false,
			storageKey: `test-move-${keySeq++}`,
			onExecute: vi.fn(),
			...props,
		})

	it('disables Execute when no frame is set', () => {
		renderSubject({ frameName: '' })

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
	})

	it('disables Execute while a move is pending, and marks it busy', () => {
		renderSubject({ isPending: true })

		const execute = screen.getByRole('button', { name: /execute/iu })
		expect(execute).toBeDisabled()
		expect(execute).toHaveAttribute('aria-busy', 'true')
		expect(screen.getByRole('progressbar', { name: 'Executing motion' })).toBeInTheDocument()
	})

	it('keeps World state and Constraints in collapsed folders', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'World state' })).toHaveAttribute(
			'aria-expanded',
			'false'
		)
		expect(screen.getByRole('button', { name: 'Constraints' })).toHaveAttribute(
			'aria-expanded',
			'false'
		)
		expect(screen.queryByRole('textbox', { name: 'World state' })).not.toBeInTheDocument()
	})

	it('says Set on a collapsed folder that holds a value', () => {
		localStorage.setItem('test-move-stored/world-state', JSON.stringify('{"obstacles": []}'))

		renderSubject({ storageKey: 'test-move-stored' })

		expect(screen.getByRole('button', { name: /^World state\s*Set$/u })).toHaveAttribute(
			'aria-expanded',
			'false'
		)
	})

	it('marks a JSON editor invalid and names the error when its value fails to parse', async () => {
		localStorage.setItem('test-move-invalid/world-state', JSON.stringify('{"obstacles": '))
		renderSubject({ storageKey: 'test-move-invalid' })

		await user.click(screen.getByRole('button', { name: /^World state\s*Set$/u }))

		const editor = screen.getByRole('textbox', { name: 'World state' })
		expect(editor).toHaveAttribute('aria-invalid', 'true')
		const errorId = editor.getAttribute('aria-errormessage')
		expect(document.querySelector(`#${CSS.escape(errorId ?? '')}`)?.textContent ?? '').not.toBe('')
	})

	it('leaves a JSON editor valid when its value parses', async () => {
		localStorage.setItem('test-move-valid/world-state', JSON.stringify('{"obstacles": []}'))
		renderSubject({ storageKey: 'test-move-valid' })

		await user.click(screen.getByRole('button', { name: /^World state\s*Set$/u }))

		const editor = screen.getByRole('textbox', { name: 'World state' })
		expect(editor).toHaveAttribute('aria-invalid', 'false')
		expect(editor).not.toHaveAttribute('aria-errormessage')
	})

	it('executes with the stored world state JSON', async () => {
		const onExecute = vi.fn()
		localStorage.setItem('test-move-execute/world-state', JSON.stringify('{"obstacles": []}'))
		renderSubject({ storageKey: 'test-move-execute', onExecute })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(onExecute).toHaveBeenCalledWith(
			expect.objectContaining({ worldStateJson: '{"obstacles": []}' })
		)
	})

	it('draws a restore button per field once a current pose is read', () => {
		renderSubject({ currentPose: { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 45 } })

		expect(document.querySelector('button[aria-label="Reset X to 1.00 mm"]')).toBeInTheDocument()
		expect(document.querySelectorAll('button[aria-label^="Reset "]')).toHaveLength(7)
		expect(
			screen.queryAllByRole('button', { name: /^Reset / }),
			'unedited fields hide their buttons'
		).toHaveLength(0)
	})

	it('draws no restore buttons before a current pose is read', () => {
		renderSubject()

		expect(document.querySelectorAll('button[aria-label^="Reset "]')).toHaveLength(0)
	})

	it('holds an edited field and restores it to the current pose', async () => {
		const onExecute = vi.fn()
		const currentPose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 45 }
		renderSubject({ currentPose, onExecute })
		await user.click(screen.getByRole('button', { name: 'Zero' }))

		await user.click(screen.getByRole('button', { name: 'Reset X to 1.00 mm' }))
		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(onExecute).toHaveBeenCalledWith(
			expect.objectContaining({ pose: { x: 1, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 } })
		)
	})

	it('calls onExecute with the default pose when no current pose is provided', async () => {
		const onExecute = vi.fn()
		renderSubject({ onExecute })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(onExecute).toHaveBeenCalledWith({
			referenceFrame: 'world',
			pose: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 },
			worldStateJson: '',
			constraintsJson: '',
		})
	})

	it('uses the destination frame as the reference frame on execute', async () => {
		const onExecute = vi.fn()
		renderSubject({ destination: 'base', onExecute })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(onExecute).toHaveBeenCalledWith(expect.objectContaining({ referenceFrame: 'base' }))
	})

	it('pre-fills the pose editor from the current pose', () => {
		renderSubject({ currentPose: { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 45 } })

		const inputs = screen.getAllByRole('spinbutton')
		expect(inputs[0]).toHaveValue(1)
		expect(inputs[1]).toHaveValue(2)
		expect(inputs[2]).toHaveValue(3)
		expect(inputs[6]).toHaveValue(45)
	})

	it('executes with the pre-filled current pose when unedited', async () => {
		const onExecute = vi.fn()
		const currentPose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 45 }
		renderSubject({ currentPose, onExecute })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(onExecute).toHaveBeenCalledWith(expect.objectContaining({ pose: currentPose }))
	})
})
