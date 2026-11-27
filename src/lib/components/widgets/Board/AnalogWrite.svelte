<script lang="ts">
	import { NumberField } from '@viamrobotics/prime-controls'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'

	import ConfirmingButton from './ConfirmingButton.svelte'

	interface Props {
		setValue: (value: number) => Promise<boolean>
		/** True while a write to this analog writer is in flight. */
		isBusy?: boolean
		/** Why Set is held back, such as no pin. */
		blockedReason?: string
	}

	const { setValue, isBusy = false, blockedReason }: Props = $props()

	let value = $state<number | undefined>(0)
</script>

<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
	<NumberField
		class="min-w-37.5 flex-1"
		label="Value"
		step={1}
		{...emptyOnClear(() => (value = undefined))}
		bind:value
	/>
	<ConfirmingButton
		verb="Set"
		{isBusy}
		{blockedReason}
		onclick={() => setValue(value ?? 0)}
	/>
</div>
