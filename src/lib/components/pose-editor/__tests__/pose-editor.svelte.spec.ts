import '../../../../app.css'

import type { Pose } from '@viamrobotics/sdk'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, createRawSnippet } from 'svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { eulerToOrientationVector } from '$lib/orientation-vector-euler'

import type { PoseFieldStatus, PoseStatusMessage } from '../pose-field-status'

import Subject from '../pose-editor.svelte'
import { turnBetween } from './__fixtures__/orientation-turn'

const textSnippet = (text: string) =>
	createRawSnippet(() => ({ render: () => `<span>${text}</span>` }))

const defaultPose: Pose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 90 }

const settledStatus: PoseFieldStatus = {
	current: 90,
	isEdited: false,
	drift: undefined,
	isMoving: false,
}

describe('PoseEditor', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const props = (overrides: Partial<ComponentProps<typeof Subject>> = {}) => ({
		pose: defaultPose,
		onPoseChange: vi.fn(),
		heading: textSnippet('Pose'),
		...overrides,
	})

	const renderSubject = (overrides: Partial<ComponentProps<typeof Subject>> = {}) =>
		render(Subject, props(overrides))

	const chooseFromMenu = async (current: string, option: string) => {
		await user.click(screen.getByRole('button', { name: current }))
		await user.click(screen.getByRole('menuitemradio', { name: option }))
	}

	const renderInWidth = (width: number) => {
		const host = document.createElement('div')
		host.style.width = `${width}px`
		document.body.append(host)
		render(Subject, { props: props(), target: host })
	}

	it.each(['X', 'Y', 'Z', 'OX', 'OY', 'OZ', 'θ (deg)'])(
		'renders a spin button named %s',
		(name) => {
			renderSubject()

			expect(screen.getByRole('spinbutton', { name })).toBeInTheDocument()
		}
	)

	it('renders exactly 7 spin buttons', () => {
		renderSubject()

		expect(screen.getAllByRole('spinbutton')).toHaveLength(7)
	})

	it('shows the description in the tooltip', () => {
		renderSubject({ description: textSnippet('expressed in the reference frame') })

		expect(screen.getByText(/expressed in the reference frame/iu)).toBeInTheDocument()
	})

	it('emits the whole pose when X is edited', async () => {
		const onPoseChange = vi.fn()
		renderSubject({ onPoseChange })

		const xInput = screen.getByRole('spinbutton', { name: 'X' })
		await user.clear(xInput)
		await user.type(xInput, '5')
		await user.tab()

		expect(onPoseChange).toHaveBeenCalledWith({ ...defaultPose, x: 5 })
	})

	it('emits theta in degrees when editing in radians', async () => {
		const onPoseChange = vi.fn()
		renderSubject({ onPoseChange })

		await chooseFromMenu('Orientation · Vector · deg', 'Radians')
		const thetaInput = screen.getByRole('spinbutton', { name: 'θ (rad)' })
		await user.clear(thetaInput)
		await user.type(thetaInput, '3.14159')
		await user.tab()

		expect(onPoseChange.mock.calls.at(-1)?.[0].theta).toBeCloseTo(180, 3)
	})

	it('has no Switch to radians button', () => {
		renderSubject()

		expect(screen.queryByRole('button', { name: /switch to radians/iu })).toBeNull()
	})

	it('shows Roll, Pitch and Yaw spin buttons in the Euler view', async () => {
		renderSubject({ pose: { ...defaultPose, oX: 0, oY: 0, oZ: -1, theta: 90 } })

		await chooseFromMenu('Orientation · Vector · deg', 'Euler')

		expect(screen.getByRole('spinbutton', { name: 'Roll' })).toBeInTheDocument()
		expect(screen.getByRole('spinbutton', { name: 'Pitch' })).toBeInTheDocument()
		expect(screen.getByRole('spinbutton', { name: 'Yaw' })).toBeInTheDocument()
	})

	it('shows no OX spin button in the Euler view', async () => {
		renderSubject()

		await chooseFromMenu('Orientation · Vector · deg', 'Euler')

		expect(screen.queryByRole('spinbutton', { name: 'OX' })).toBeNull()
	})

	it.each([
		{ name: 'Roll', value: 180 },
		{ name: 'Pitch', value: 0 },
		{ name: 'Yaw', value: 90 },
	])('reads $name as $value for pose (0, 0, -1, 90)', async ({ name, value }) => {
		renderSubject({ pose: { ...defaultPose, oX: 0, oY: 0, oZ: -1, theta: 90 } })

		await chooseFromMenu('Orientation · Vector · deg', 'Euler')

		expect(screen.getByRole('spinbutton', { name })).toHaveValue(value)
	})

	it('emits the orientation vector of x90 when Roll 90 is typed on the identity pose', async () => {
		const onPoseChange = vi.fn()
		renderSubject({ pose: { ...defaultPose, oX: 0, oY: 0, oZ: 1, theta: 0 }, onPoseChange })
		await chooseFromMenu('Orientation · Vector · deg', 'Euler')

		const roll = screen.getByRole('spinbutton', { name: 'Roll' })
		await user.clear(roll)
		await user.type(roll, '90')
		await user.tab()

		const emitted = onPoseChange.mock.calls.at(-1)?.[0]
		const message = 'rdk golden case "x90, from rmQuatSamples"'
		expect(emitted.oX, message).toBeCloseTo(0, 6)
		expect(emitted.oY, message).toBeCloseTo(-1, 6)
		expect(emitted.oZ, message).toBeCloseTo(0, 6)
		expect(emitted.theta, message).toBeCloseTo(90, 6)
	})

	it('emits nothing when switching to Euler and back', async () => {
		const onPoseChange = vi.fn()
		renderSubject({ onPoseChange })

		await chooseFromMenu('Orientation · Vector · deg', 'Euler')
		await chooseFromMenu('Orientation · Euler · deg', 'Vector')

		expect(onPoseChange).not.toHaveBeenCalled()
	})

	const gimbalText =
		'At pitch 90°, roll and yaw turn about the same axis. Use Vector to edit this orientation.'
	const alongPositiveX: Pose = { ...defaultPose, oX: 1, oY: 0, oZ: 0, theta: 0 }

	it('shows the gimbal hint in the Euler view for an orientation vector along +X', async () => {
		renderSubject({ pose: alongPositiveX })

		await chooseFromMenu('Orientation · Vector · deg', 'Euler')

		expect(screen.getByRole('status').textContent?.trim()).toBe(gimbalText)
	})

	it('shows no gimbal hint in the vector view for an orientation vector along +X', () => {
		renderSubject({ pose: alongPositiveX })

		expect(screen.getByRole('status')).toBeEmptyDOMElement()
	})

	it('calls onFieldReset for all four orientation keys when Roll is restored alone', async () => {
		const onFieldReset = vi.fn()
		const live: Pose = { ...defaultPose, oX: 0, oY: 0, oZ: -1, theta: 90 }
		const target = {
			...live,
			...eulerToOrientationVector({ roll: 170, pitch: 0, yaw: 90 }),
		}
		renderSubject({
			pose: target,
			fieldStatus: (key) => ({
				current: live[key],
				isEdited: true,
				drift: undefined,
				isMoving: false,
			}),
			onFieldReset,
		})
		await chooseFromMenu('Orientation · Vector · deg', 'Euler')

		await user.click(screen.getByRole('button', { name: 'Reset Roll to its current value, 180.0' }))

		expect(onFieldReset.mock.calls.map(([key]) => key)).toEqual(['oX', 'oY', 'oZ', 'theta'])
	})

	it('emits the pose with Roll at its live value when Yaw is also edited', async () => {
		const onFieldReset = vi.fn()
		const onPoseChange = vi.fn()
		const live: Pose = { ...defaultPose, oX: 0, oY: 0, oZ: -1, theta: 90 }
		const target = {
			...live,
			...eulerToOrientationVector({ roll: 170, pitch: 0, yaw: 80 }),
		}
		const fieldStatus = (key: keyof Pose): PoseFieldStatus => ({
			current: live[key],
			isEdited: true,
			drift: undefined,
			isMoving: false,
		})
		const { rerender } = renderSubject({ pose: target, fieldStatus, onFieldReset, onPoseChange })
		await chooseFromMenu('Orientation · Vector · deg', 'Euler')

		await user.click(screen.getByRole('button', { name: 'Reset Roll to its current value, 180.0' }))
		const emitted: Pose = onPoseChange.mock.calls.at(-1)?.[0]
		await rerender({ ...props({ fieldStatus, onFieldReset, onPoseChange }), pose: emitted })

		expect(onFieldReset).not.toHaveBeenCalled()
		expect(screen.getByRole('spinbutton', { name: 'Roll' })).toHaveValue(180)
		expect(screen.getByRole('spinbutton', { name: 'Yaw' })).toHaveValue(80)
	})

	it('reads Yaw as 1.571 in the Euler view with radians', async () => {
		renderSubject({ pose: { ...defaultPose, oX: 0, oY: 0, oZ: -1, theta: 90 } })
		await chooseFromMenu('Orientation · Vector · deg', 'Euler')

		await chooseFromMenu('Orientation · Euler · deg', 'Radians')

		expect(screen.getByRole('spinbutton', { name: 'Yaw' })).toHaveValue(1.571)
	})

	it('shows no restore button without fieldStatus', () => {
		renderSubject()

		expect(screen.queryByRole('button', { name: /^Reset/u })).toBeNull()
	})

	it('gives no spin button a description without fieldStatus', () => {
		renderSubject()

		const described = screen
			.getAllByRole('spinbutton')
			.filter((input) => input.hasAttribute('aria-describedby'))

		expect(described).toEqual([])
	})

	it('draws 7 restore buttons with fieldStatus', () => {
		renderSubject({ fieldStatus: () => settledStatus })

		expect(screen.getAllByRole('button', { name: /^Reset/u })).toHaveLength(7)
	})

	it('names the theta restore button with the current value in radians', async () => {
		renderSubject({ fieldStatus: () => settledStatus })

		await chooseFromMenu('Orientation · Vector · deg', 'Radians')

		expect(
			screen.getByRole('button', { name: 'Reset θ to its current value, 1.571' })
		).toBeInTheDocument()
	})

	it('calls onFieldReset with the field key', async () => {
		const onFieldReset = vi.fn()
		renderSubject({
			fieldStatus: () => ({ ...settledStatus, isEdited: true }),
			onFieldReset,
		})

		await user.click(screen.getByRole('button', { name: /^Reset OY/u }))

		expect(onFieldReset).toHaveBeenCalledWith('oY')
	})

	it('puts X inside the Position group', () => {
		renderSubject()

		const group = screen.getByRole('group', { name: 'Position, millimeters' })

		expect(within(group).getByRole('spinbutton', { name: 'X' })).toBeInTheDocument()
	})

	it('puts OX inside the Orientation group', () => {
		renderSubject()

		const group = screen.getByRole('group', { name: 'Orientation' })

		expect(within(group).getByRole('spinbutton', { name: 'OX' })).toBeInTheDocument()
	})

	it('explains the normalized vector when the orientation is not unit length', () => {
		renderSubject({ pose: { ...defaultPose, oX: 0.5, oY: 0, oZ: -1 } })

		expect(screen.getByRole('status').textContent?.trim()).toBe(
			'Not unit length. Execute sends OX 0.447, OY 0.000, OZ -0.894.'
		)
	})

	it('leaves the hint empty for a unit vector', () => {
		renderSubject()

		expect(screen.getByRole('status')).toBeEmptyDOMElement()
	})

	it('stacks the fields in a 300 px wide container', () => {
		renderInWidth(300)

		const x = screen.getByRole('spinbutton', { name: 'X' }).getBoundingClientRect()
		const y = screen.getByRole('spinbutton', { name: 'Y' }).getBoundingClientRect()

		expect(y.top).toBeGreaterThanOrEqual(x.bottom)
	})

	it('lays the fields in a row in a 400 px wide container', () => {
		renderInWidth(400)

		const x = screen.getByRole('spinbutton', { name: 'X' }).getBoundingClientRect()
		const y = screen.getByRole('spinbutton', { name: 'Y' }).getBoundingClientRect()

		expect(y.top).toBe(x.top)
	})

	describe('statusMessage', () => {
		const driftedStatus: PoseFieldStatus = {
			current: 90,
			isEdited: true,
			drift: 12,
			isMoving: false,
		}

		const wordedStatusMessage = createRawSnippet<[PoseStatusMessage]>((details) => ({
			render: () =>
				`<span>${details().kind === 'drift' ? `The rig shifted ${details().amount}` : 'The rig is busy'}</span>`,
		}))

		it('describes a drifted X field with the neutral copy without statusMessage', () => {
			renderSubject({ fieldStatus: () => driftedStatus })

			expect(screen.getByRole('spinbutton', { name: 'X' })).toHaveAccessibleDescription(
				expect.stringContaining('Moved 12.00 mm since you edited X.')
			)
		})

		it('describes a drifted X field with the snippet text instead', () => {
			renderSubject({ fieldStatus: () => driftedStatus, statusMessage: wordedStatusMessage })

			const description = screen.getByRole('spinbutton', { name: 'X' })

			expect(description).toHaveAccessibleDescription(
				expect.stringContaining('The rig shifted 12.00 mm')
			)
			expect(description).not.toHaveAccessibleDescription(expect.stringContaining('Moved 12.00 mm'))
		})

		it('describes an Euler field with the snippet text', async () => {
			const live: Pose = { ...defaultPose, oX: 0, oY: 0, oZ: -1, theta: 90 }
			const target = {
				...live,
				...eulerToOrientationVector({ roll: 170, pitch: 0, yaw: 90 }),
			}
			renderSubject({
				pose: target,
				fieldStatus: (key) => ({
					current: live[key],
					isEdited: true,
					drift: undefined,
					isMoving: true,
				}),
				statusMessage: wordedStatusMessage,
			})
			await chooseFromMenu('Orientation · Vector · deg', 'Euler')

			expect(screen.getByRole('spinbutton', { name: 'Roll' })).toHaveAccessibleDescription(
				expect.stringContaining('The rig is busy')
			)
		})
	})

	describe('rotation editor toggle', () => {
		const getToggle = () => screen.getByRole('button', { name: 'Rotation editor' })
		const getRegion = () => {
			const controls = getToggle().getAttribute('aria-controls') ?? ''
			const region = document.querySelector(`#${CSS.escape(controls)}`)
			if (!region) throw new Error('The rotation editor region is not in the document')
			return region as HTMLElement
		}

		it('starts collapsed with nothing at its aria-controls id', () => {
			renderSubject()

			const controls = getToggle().getAttribute('aria-controls') ?? ''
			expect(getToggle()).toHaveAttribute('aria-expanded', 'false')
			expect(controls).not.toBe('')
			expect(document.querySelector(`#${CSS.escape(controls)}`)).toBeNull()
		})

		it('opens the region on activation and removes it on the second', async () => {
			renderSubject()
			const controls = getToggle().getAttribute('aria-controls') ?? ''

			await user.click(getToggle())

			expect(getToggle()).toHaveAttribute('aria-expanded', 'true')
			expect(document.querySelector(`#${CSS.escape(controls)}`)).toBeInTheDocument()

			await user.click(getToggle())

			expect(getToggle()).toHaveAttribute('aria-expanded', 'false')
			expect(document.querySelector(`#${CSS.escape(controls)}`)).toBeNull()
		})

		it('is present in the Euler view', async () => {
			renderSubject()

			await chooseFromMenu('Orientation · Vector · deg', 'Euler')

			expect(getToggle()).toBeInTheDocument()
		})

		it('shows the rotation gizmo in the region on one activation', async () => {
			renderSubject()

			await user.click(getToggle())

			expect(
				within(getRegion()).getByRole('application', { name: 'Rotation gizmo' })
			).toBeInTheDocument()
		})

		it('adds no text field to the region', async () => {
			renderSubject()

			await user.click(getToggle())

			expect(within(getRegion()).queryAllByRole('textbox')).toHaveLength(0)
			expect(within(getRegion()).queryAllByRole('spinbutton')).toHaveLength(0)
		})

		it('keeps the seven fields when the region opens', async () => {
			renderSubject()

			await user.click(getToggle())

			expect(screen.getAllByRole('spinbutton')).toHaveLength(7)
		})

		it('emits the pose with its position and an orientation π/16 away on ArrowRight', async () => {
			const onPoseChange = vi.fn()
			renderSubject({ onPoseChange })
			await user.click(getToggle())
			screen.getByRole('application', { name: 'Rotation gizmo' }).focus()

			await user.keyboard('{ArrowRight}')

			const emitted: Pose = onPoseChange.mock.calls.at(-1)?.[0]
			expect([emitted.x, emitted.y, emitted.z]).toEqual([1, 2, 3])
			expect(turnBetween(defaultPose, emitted)).toBeCloseTo(Math.PI / 16, 6)
		})
	})
})
