<script lang="ts">
	import { NumberField } from '@viamrobotics/prime-controls'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'

	import { readValidRpm } from './read-valid-rpm'
	import { resolveMaxRpm } from './resolve-max-rpm'

	interface Props {
		/** The typed speed in revolutions per minute. An empty field is `undefined`. */
		value?: number
		/** Help text for the field's info tooltip. */
		hint: string
		/**
		 * The most RPM a send may carry, from the gpio motor config's `max_rpm`, in revolutions per
		 * minute. The field caps at it, and a value over it is flagged and never clamped. Used only
		 * when finite and above 0. @default undefined
		 */
		maxRpm?: number
	}

	const MINIMUM_RPM = 0

	let { value = $bindable(), hint, maxRpm }: Props = $props()

	const messageId = $props.id()

	const limit = $derived(resolveMaxRpm(maxRpm))
	const isOverLimit = $derived(
		value !== undefined && limit !== undefined && Number.isFinite(value) && value > limit
	)
	const isInvalid = $derived(readValidRpm(value, maxRpm) === undefined)
</script>

<NumberField
	label="RPM"
	{hint}
	min={MINIMUM_RPM}
	max={limit}
	state={isInvalid ? 'error' : undefined}
	aria-describedby={isOverLimit ? messageId : undefined}
	{...emptyOnClear(() => (value = undefined))}
	bind:value
/>
{#if isOverLimit}
	<p
		id={messageId}
		role="alert"
		class="text-danger-dark text-xs"
	>
		RPM cannot exceed the motor's limit of {limit}.
	</p>
{/if}
