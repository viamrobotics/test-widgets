<script lang="ts">
	import { NumberField } from '@viamrobotics/prime-controls'

	import ConfirmingButton from './confirming-button.svelte'

	interface Props {
		setValue: (value: number) => Promise<boolean>
		/** True while a write to this analog writer is in flight. */
		isBusy?: boolean
	}

	const { setValue, isBusy = false }: Props = $props()

	let value = $state<number | undefined>(0)
</script>

<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
	<NumberField
		class="min-w-37.5 flex-1"
		label="Value"
		step={1}
		bind:value
	/>
	<ConfirmingButton
		verb="Set"
		{isBusy}
		onclick={() => setValue(value ?? 0)}
	/>
</div>
