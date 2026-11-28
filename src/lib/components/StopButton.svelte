<script lang="ts">
	interface Props {
		onStop: () => void
	}

	const { onStop }: Props = $props()
</script>

<button
	type="button"
	class="button button-danger button-outline font-roboto-mono w-fit uppercase"
	onclick={onStop}
>
	Stop
</button>
