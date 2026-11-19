<script lang="ts">
	interface Props {
		onGrab: () => void
		size?: 'compact' | 'xs'
	}

	const SIZE_CLASSES = {
		compact: 'button-compact',
		xs: 'button-xs',
	}

	const { onGrab, size = 'compact' }: Props = $props()
</script>

<button
	type="button"
	class={['button', SIZE_CLASSES[size]]}
	onclick={onGrab}
>
	Grab
</button>
