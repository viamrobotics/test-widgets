<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'

	interface Props {
		label: string
		isSupported: boolean | undefined
	}

	const { label, isSupported }: Props = $props()

	const MISSING_VALUE = '-'

	const labelId = $props.id()

	const supportText = $derived.by(() => {
		if (isSupported === undefined) return MISSING_VALUE
		return isSupported ? 'Supported' : 'Not supported'
	})
</script>

<div class="flex min-w-0 items-center gap-1">
	<span
		id={labelId}
		class="text-subtle-1 w-31 shrink-0 truncate text-xs">{label}</span
	>
	<span
		role="group"
		aria-labelledby={labelId}
		class="readout font-roboto-mono inline-flex items-center gap-2"
	>
		{#if isSupported !== undefined}
			<StatusDot
				state={isSupported ? 'success' : 'disabled'}
				{label}
			/>
		{/if}
		<span class="readout-value">{supportText}</span>
	</span>
</div>
