<script lang="ts">
	interface Props {
		onError: (error: Error) => void
	}

	const { onError }: Props = $props()
</script>

<button
	type="button"
	onclick={() => {
		onError(new Error('A per-frame task threw.'))
	}}
>
	Throw in a frame
</button>
