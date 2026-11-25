<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'

	interface Props {
		/** The last Home call's result. Undefined until Home has returned in this session. */
		isHomed: boolean | undefined
	}

	const { isHomed }: Props = $props()

	const labelId = $props.id()
</script>

<div class="flex min-w-0 items-center gap-2">
	<span
		id={labelId}
		class="text-subtle-1 text-xs">Homed</span
	>
	<span
		role="group"
		aria-labelledby={labelId}
		class="readout font-roboto-mono inline-flex items-center gap-2"
	>
		{#if isHomed === undefined}
			-
		{:else}
			<StatusDot
				state={isHomed ? 'success' : 'disabled'}
				label="Homed"
			/>
			{isHomed ? 'Yes' : 'No'}
		{/if}
	</span>
</div>
