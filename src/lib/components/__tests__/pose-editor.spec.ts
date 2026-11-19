import '../../../app.css'

import type { Pose } from '@viamrobotics/sdk'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, createRawSnippet } from 'svelte'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'

import { assertExists } from '$lib/assert'

import Subject from '../pose-editor.svelte'

const textSnippet = (text: string) =>
	createRawSnippet(() => ({ render: () => `<span>${text}</span>` }))

const defaultPose: Pose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 90 }

describe('PoseEditor', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>> = {}) =>
		render(Subject, {
			pose: defaultPose,
			onPoseChange: vi.fn(),
			heading: textSnippet('Pose'),
			...props,
		})

	const renderHoldingEdits = () => {
		const onPoseChange = vi.fn<(pose: Pose) => void>()
		const view = renderSubject({ onPoseChange })
		onPoseChange.mockImplementation((pose) => {
			void view.rerender({ pose })
		})
		return { onPoseChange }
	}

	const xField = () => {
		const xInput = screen.getAllByRole('spinbutton')[0]
		assertExists(xInput, 'Expected an X input')
		return xInput
	}

	it('renders a spinbutton per pose field', () => {
		renderSubject()

		expect(screen.getAllByRole('spinbutton')).toHaveLength(7)
	})

	it('states the position unit once, in the group label, with three fields under it', () => {
		renderSubject()

		const position = screen.getByRole('group', { name: 'Position, mm' })

		expect(within(position).getAllByRole('spinbutton')).toHaveLength(3)
		expect(within(position).queryByText('mm')).not.toBeInTheDocument()
	})

	it('shows theta with a degree suffix', () => {
		renderSubject()

		expect(screen.getByRole('spinbutton', { name: 'θ' })).toHaveAccessibleDescription('°')
	})

	it('shows the description in an info tooltip when provided', async () => {
		renderSubject({ description: textSnippet('expressed in the reference frame') })

		screen.getByRole('button', { name: 'About Pose' }).focus()

		expect(
			await screen.findByRole('tooltip', { name: /expressed in the reference frame/iu })
		).toBeInTheDocument()
	})

	it('emits pose changes when a value is edited', async () => {
		const { onPoseChange } = renderHoldingEdits()

		await user.clear(xField())
		await user.type(xField(), '5')

		expect(onPoseChange).toHaveBeenLastCalledWith({ ...defaultPose, x: 5 })
	})

	it('takes a decimal typed one key at a time', async () => {
		const { onPoseChange } = renderHoldingEdits()

		await user.clear(xField())
		await user.type(xField(), '7.256')

		expect(onPoseChange).toHaveBeenLastCalledWith({ ...defaultPose, x: 7.256 })
		expect(xField(), 'the third decimal stays under the cursor').toHaveValue(7.256)
	})

	it('takes a negative number typed into an emptied field', async () => {
		const { onPoseChange } = renderHoldingEdits()

		await user.clear(xField())
		await user.type(xField(), '-5')

		expect(onPoseChange).toHaveBeenLastCalledWith({ ...defaultPose, x: -5 })
	})

	it('shows the held value again when an emptied field loses focus', async () => {
		renderHoldingEdits()

		await user.clear(xField())
		await user.tab()

		expect(xField()).toHaveValue(1)
	})

	it('emits theta in degrees even when editing in radians', async () => {
		const { onPoseChange } = renderHoldingEdits()

		await user.click(screen.getByRole('button', { name: /switch to radians/iu }))

		const thetaInput = screen.getByRole('spinbutton', { name: 'θ' })
		await user.clear(thetaInput)
		await user.type(thetaInput, '3.14159')

		expect(onPoseChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ theta: expect.closeTo(180, 1) })
		)
	})

	it.each([
		{ width: 302, layout: 'stacks orientation under position', isBeside: false },
		{ width: 622, layout: 'puts orientation beside position', isBeside: true },
	])('$layout at $width px', ({ width, isBeside }) => {
		const target = document.createElement('div')
		document.body.append(target)
		onTestFinished(() => {
			target.remove()
		})
		target.style.width = `${width}px`

		render(Subject, {
			props: { pose: defaultPose, onPoseChange: vi.fn(), heading: textSnippet('Pose') },
			target,
		})

		const position = screen.getByRole('group', { name: 'Position, mm' }).getBoundingClientRect()
		const orientation = screen.getByRole('group', { name: 'Orientation' }).getBoundingClientRect()
		expect(orientation.top === position.top, 'orientation shares the position row').toBe(isBeside)
	})
})
