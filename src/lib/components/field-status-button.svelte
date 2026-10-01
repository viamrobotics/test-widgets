<script lang="ts">
	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	interface Props {
		status: 'info' | 'warn'
		/** Shown in the tooltip and read as the button's label. */
		message: string
		/**
		 * Sits over an input's own `state` icon, which cannot take focus or hover,
		 * so the button draws no icon of its own.
		 */
		overlay?: boolean
	}

	const { status, message, overlay = false }: Props = $props()
</script>

<span class={['flex', overlay && 'absolute top-1.5 right-2']}>
	<Tooltip>
		<button
			type="button"
			class={[
				'flex size-4 cursor-help items-center justify-center',
				status === 'warn' ? 'text-warning-bright' : 'text-info-dark',
			]}
			aria-label={message}
		>
			{#if !overlay}
				<Icon name={status === 'warn' ? 'alert' : 'information'} />
			{/if}
		</button>
		<span slot="description">{message}</span>
	</Tooltip>
</span>
