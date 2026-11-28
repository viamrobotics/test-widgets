<script lang="ts">
	import { Tooltip } from '@viamrobotics/prime-ui'

	interface Props {
		onOpen: () => void
		/** True while a gripper move is in flight. The button reads disabled and says why. */
		isBusy: boolean
	}

	const BUSY_REASON = 'Wait for the gripper to finish moving.'

	const { onOpen, isBusy }: Props = $props()

	const reasonId = $props.id()
</script>

<Tooltip disabled={!isBusy}>
	<Tooltip.Trigger>
		<!-- aria-disabled, not disabled: the button keeps focus, so the tooltip can say why. -->
		<button
			type="button"
			class="button button-compact"
			aria-disabled={isBusy || undefined}
			aria-describedby={isBusy ? reasonId : undefined}
			onclick={() => {
				if (!isBusy) onOpen()
			}}
		>
			Open
		</button>
	</Tooltip.Trigger>
	<Tooltip.Content class="max-w-72">{BUSY_REASON}</Tooltip.Content>
</Tooltip>
{#if isBusy}
	<span
		id={reasonId}
		class="sr-only">{BUSY_REASON}</span
	>
{/if}
