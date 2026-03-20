<script lang="ts">
	import type { Vector3 } from '@viamrobotics/sdk'

	import { Icon, Label, RangeInput } from '@viamrobotics/prime-core'
	import { onMount } from 'svelte'
	import { twMerge } from 'tailwind-merge'

	import { numberValueFromEvent } from '$lib/event-handlers'

	interface Props {
		setPower: (linear: Vector3, angular: Vector3) => void
		isKeyboardEnabled: boolean
	}

	const { setPower, isKeyboardEnabled }: Props = $props()

	let powerPct = $state(0.5)

	// When setPower commands are sent in quick succession, sometimes
	// the RDK base model handles the responses out of order. To make
	// sure the base truly stops, send an extra stop command 50ms
	// later.
	let stopTimeoutID = 0

	const setPowerScalar = (linearPct: number, angularPct: number) => {
		globalThis.clearTimeout(stopTimeoutID)
		setPower({ x: 0, y: linearPct, z: 0 }, { x: 0, y: 0, z: angularPct })
		if (linearPct === 0 && angularPct === 0) {
			stopTimeoutID = globalThis.setTimeout(() => {
				setPower({ x: 0, y: linearPct, z: 0 }, { x: 0, y: 0, z: angularPct })
			}, 50)
		}
	}

	onMount(() => {
		return () => {
			globalThis.clearTimeout(stopTimeoutID)
		}
	})

	let isPressed = false
	const makeMouseDown = (linearPct: number, angularPct: number) => () => {
		isPressed = true
		setPowerScalar(linearPct, angularPct)
	}
	const mouseEnd = () => {
		if (isPressed) {
			setPowerScalar(0, 0)
		}
		isPressed = false
	}

	const buttonCx =
		'flex gap-2 justify-center items-center w-[60px] border border-light bg-light px-2.5 py-3 hover:border-medium hover:bg-medium active:bg-gray-2 h-fit'

	const keys = {
		W_KEY: 'w',
		A_KEY: 'a',
		S_KEY: 's',
		D_KEY: 'd',
	} as const
	const pressedKeys: Record<(typeof keys)[keyof typeof keys], boolean> = $state({
		[keys.W_KEY]: false,
		[keys.A_KEY]: false,
		[keys.S_KEY]: false,
		[keys.D_KEY]: false,
	})

	const normalizeKey = (key: string) => {
		switch (key.toLowerCase()) {
			case 'w':
			case 'arrowup': {
				return keys.W_KEY
			}
			case 'a':
			case 'arrowleft': {
				return keys.A_KEY
			}
			case 's':
			case 'arrowdown': {
				return keys.S_KEY
			}
			case 'd':
			case 'arrowright': {
				return keys.D_KEY
			}
			default: {
				return undefined
			}
		}
	}

	const onKeydown = (event: KeyboardEvent) => {
		if (!isKeyboardEnabled || event.repeat) {
			return
		}

		const key = normalizeKey(event.key)
		if (!key) {
			return
		}

		event.stopPropagation()
		event.preventDefault()

		pressedKeys[key] = true
		onKeyChange()
	}

	const onKeyup = (event: KeyboardEvent) => {
		if (!isKeyboardEnabled) {
			return
		}

		const key = normalizeKey(event.key)
		if (!key) {
			return
		}

		event.stopPropagation()
		event.preventDefault()

		pressedKeys[key] = false
		onKeyChange()
	}

	const onKeyChange = () => {
		const linearPct = ((pressedKeys.w ? 1 : 0) - (pressedKeys.s ? 1 : 0)) * powerPct
		const angularPct = ((pressedKeys.a ? 1 : 0) - (pressedKeys.d ? 1 : 0)) * powerPct
		setPowerScalar(linearPct, angularPct)
	}
</script>

<svelte:window
	onkeydown={onKeydown}
	onkeyup={onKeyup}
/>

<div class="flex grow flex-col gap-6">
	<div class="flex w-fit flex-col gap-4">
		<!-- NOTE(zp,2024-06-04) these are not prime buttons because prime does not provide on:mousedown or on:mouseup -->
		<!-- TODO(APP-4936) add the correct icons to prime instead of rotating & scaling-->
		<div class="flex items-center gap-2">
			<!-- turn left -->
			<button
				onmousedown={makeMouseDown(0, powerPct)}
				aria-label="left"
				onmouseup={mouseEnd}
				onmouseleave={mouseEnd}
				class={twMerge(buttonCx, pressedKeys.a && 'bg-gray-2')}
			>
				<Icon
					name="undo"
					cx="text-gray-6"
				/>
				{#if isKeyboardEnabled}
					<div class="text-gray-6 text-sm font-semibold">A</div>
				{/if}
			</button>
			<div class="flex flex-col gap-2">
				<!-- forwards -->
				<button
					onmousedown={makeMouseDown(powerPct, 0)}
					aria-label="forwards"
					onmouseup={mouseEnd}
					onmouseleave={mouseEnd}
					class={twMerge(buttonCx, 'flex-col', pressedKeys.w && 'bg-gray-2')}
				>
					<Icon
						name="arrow-up"
						cx="text-gray-6"
					/>
					{#if isKeyboardEnabled}
						<div class="text-gray-6 text-sm font-semibold">W</div>
					{/if}
				</button>
				<!-- backwards -->
				<button
					onmousedown={makeMouseDown(-1 * powerPct, 0)}
					aria-label="backwards"
					onmouseup={mouseEnd}
					onmouseleave={mouseEnd}
					class={twMerge(buttonCx, 'flex-col', pressedKeys.s && 'bg-gray-2')}
				>
					{#if isKeyboardEnabled}
						<div class="text-gray-6 text-sm font-semibold">S</div>
					{/if}
					<Icon
						name="arrow-up"
						cx="text-gray-6 rotate-180"
					/>
				</button>
			</div>

			<!-- turn right -->
			<button
				onmousedown={makeMouseDown(0, -1 * powerPct)}
				aria-label="right"
				onmouseup={mouseEnd}
				onmouseleave={mouseEnd}
				class={twMerge(buttonCx, pressedKeys.d && 'bg-gray-2')}
			>
				{#if isKeyboardEnabled}
					<div class="text-gray-6 text-sm font-semibold">D</div>
				{/if}
				<Icon
					name="undo"
					cx="text-gray-6 scale-x-[-1]"
				/>
			</button>
		</div>
		<p class="text-subtle-2 mx-auto text-xs">Press and hold</p>
	</div>

	<Label cx="max-w-[282px] grow">
		<span class="text-subtle-1 text-xs">Power</span>

		<RangeInput
			slot="input"
			max={1}
			step={0.05}
			value={powerPct}
			on:input={(event) => {
				// on:input is used instead of on:change because of the on:mousedown handlers and blur order
				// on:change does not run in time.
				powerPct = numberValueFromEvent(event) ?? 0
			}}
		/>
	</Label>
</div>
