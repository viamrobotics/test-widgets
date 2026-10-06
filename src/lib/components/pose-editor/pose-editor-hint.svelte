<script lang="ts">
	import { Icon } from '@viamrobotics/prime-core'

	interface Props {
		tone?: 'info' | 'warn'
		text?: string
	}

	const { tone, text }: Props = $props()
</script>

<div role="status">
	{#if tone && text}
		<div class="flex gap-1">
			<Icon
				name={tone === 'warn' ? 'alert-outline' : 'information-outline'}
				cx={tone === 'warn' ? 'text-warning-dark' : 'text-info-dark'}
				aria-hidden="true"
			/>
			<span class="text-default text-xs">{text}</span>
		</div>
	{/if}
</div>
