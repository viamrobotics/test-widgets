<script lang="ts">
	import { mdiArrowUp } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { pressAndHold } from '#lib/components/press-and-hold.js'

	type Direction = 'forward' | 'backward'

	interface Props {
		/** Fires once when a hold starts. A second button pressed during a hold is ignored. */
		onPress: (direction: Direction) => void
		/** Fires once when the hold that `onPress` started ends. */
		onRelease: () => void
		/** Disables the button not held, so the held one still reports its release. */
		isDisabled: boolean
	}

	const { onPress, onRelease, isDisabled }: Props = $props()

	// Two quick moves can share a page, so the hint id is per instance.
	const instanceId = $props.id()
	const holdHintId = `${instanceId}-hold-hint`

	let heldDirection = $state<Direction | null>(null)

	const isForwardDisabled = $derived(isDisabled && heldDirection !== 'forward')
	const isBackwardDisabled = $derived(isDisabled && heldDirection !== 'backward')

	const start = (direction: Direction) => {
		if (heldDirection !== null) {
			return
		}
		heldDirection = direction
		onPress(direction)
	}

	const stop = (direction: Direction) => {
		if (heldDirection !== direction) {
			return
		}
		heldDirection = null
		onRelease()
	}
</script>

<div class="mt-1 flex flex-wrap items-center gap-4">
	<button
		type="button"
		class={['button button-xs touch-none', heldDirection === 'forward' && 'button-dark']}
		aria-describedby={holdHintId}
		disabled={isForwardDisabled}
		{@attach pressAndHold({
			onPress: () => {
				start('forward')
			},
			onRelease: () => {
				stop('forward')
			},
		})}
	>
		<Icon
			icon={mdiArrowUp}
			size="sm"
		/>
		Forward
	</button>
	<button
		type="button"
		class={['button button-xs touch-none', heldDirection === 'backward' && 'button-dark']}
		aria-describedby={holdHintId}
		disabled={isBackwardDisabled}
		{@attach pressAndHold({
			onPress: () => {
				start('backward')
			},
			onRelease: () => {
				stop('backward')
			},
		})}
	>
		<Icon
			icon={mdiArrowUp}
			size="sm"
			class="rotate-180"
		/>
		Backward
	</button>
	<p
		id={holdHintId}
		class="text-subtle-2 ml-auto text-xs"
	>
		Press and hold
	</p>
</div>
