<script lang="ts">
	interface Props {
		onOpen: () => void
		/** True while another gripper move is in flight. The button is disabled. */
		isBusy: boolean
		size?: 'compact' | 'xs'
	}

	const SIZE_CLASSES = {
		compact: 'button-compact',
		xs: 'button-xs',
	}

	const { onOpen, isBusy, size = 'compact' }: Props = $props()
</script>

<button
	type="button"
	class={['button', SIZE_CLASSES[size]]}
	disabled={isBusy}
	onclick={onOpen}
>
	Open
</button>
