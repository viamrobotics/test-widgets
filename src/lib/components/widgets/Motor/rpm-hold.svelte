<script lang="ts">
	import HoldDirectionButtons from './hold-direction-buttons.svelte'
	import { readValidRpm } from './read-valid-rpm'
	import RpmField from './rpm-field.svelte'

	interface Props {
		/** Sends the signed speed: positive while Forward is held, negative while Backward is. */
		setRPM: (rpm: number) => void
		onRelease: () => void
		/** True while another motion call is in flight, which disables the button not held. @default false */
		isBusy?: boolean
		/**
		 * The most RPM a send may carry, from the gpio motor config's `max_rpm`, in revolutions per
		 * minute. The field caps at it, and a value over it is flagged and not sent. Used only when
		 * finite and above 0. @default undefined
		 */
		maxRpm?: number
	}

	type Direction = 'forward' | 'backward'

	const DEFAULT_RPM = 10
	const DIRECTION_SIGN = { forward: 1, backward: -1 } as const satisfies Record<Direction, number>

	const { setRPM, onRelease, isBusy = false, maxRpm }: Props = $props()

	let rpm = $state<number | undefined>(DEFAULT_RPM)

	// An empty or negative speed holds back both buttons. The direction comes from the button held.
	const validRpm: number | undefined = $derived(readValidRpm(rpm, maxRpm))

	const start = (direction: Direction) => {
		if (validRpm === undefined) {
			return
		}
		setRPM(DIRECTION_SIGN[direction] * validRpm)
	}
</script>

<div class="flex flex-col gap-1">
	<RpmField
		hint="Speed in revolutions per minute. The button held sets the direction."
		{maxRpm}
		bind:value={rpm}
	/>

	<HoldDirectionButtons
		onPress={start}
		{onRelease}
		isDisabled={validRpm === undefined || isBusy}
	/>
</div>
