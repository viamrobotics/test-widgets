<script lang="ts">
	interface Props {
		onOpen: () => void
		size?: 'compact' | 'xs'
	}

	const SIZE_CLASSES = {
		compact: 'button-compact',
		xs: 'button-xs',
	}

	const { onOpen, size = 'compact' }: Props = $props()
</script>

<button
	type="button"
	class={['button', SIZE_CLASSES[size]]}
	onclick={onOpen}
>
	Open
</button>
