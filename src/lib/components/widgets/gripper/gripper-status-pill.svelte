<script lang="ts">
	import { Tooltip } from '@viamrobotics/prime-ui'

	interface Props {
		/** IsMoving's reading. Undefined until the first poll lands. */
		isMoving: boolean | undefined
		/** IsHoldingSomething's reading. Undefined until the first poll lands. */
		isHolding: boolean | undefined
	}

	const { isMoving, isHolding }: Props = $props()

	const UNREAD_PLACEHOLDER = '-'

	const movingText = $derived.by(() => {
		if (isMoving === undefined) return UNREAD_PLACEHOLDER
		return isMoving ? 'Moving' : 'Idle'
	})
	const holdingText = $derived.by(() => {
		if (isHolding === undefined) return UNREAD_PLACEHOLDER
		return isHolding ? 'Holding' : 'Empty'
	})
	const movingTone = $derived(isMoving ? 'badge-success' : 'badge-neutral')
	const holdingTone = $derived(isHolding ? 'badge-success' : 'badge-neutral')
</script>

<Tooltip>
	<Tooltip.Trigger>
		<!-- One focus stop for both sides. Keyboard focus is the only way to open the tooltip without a pointer. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<span
			role="group"
			aria-label="Gripper status"
			class="inline-flex items-center gap-px"
			tabindex="0"
		>
			<span class={['badge rounded-r-none', movingTone]}>{movingText}</span>
			<span class={['badge rounded-l-none', holdingTone]}>{holdingText}</span>
		</span>
	</Tooltip.Trigger>
	<Tooltip.Content>Updates automatically</Tooltip.Content>
</Tooltip>
