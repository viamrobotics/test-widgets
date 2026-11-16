<script lang="ts">
	import Boundary from '../boundary.svelte'

	interface Props {
		error?: Error
	}

	const { error = new Error('test error') }: Props = $props()

	const throwError = (): string => {
		throw error
	}
</script>

<Boundary>
	{@const message = throwError()}
	<p>{message}</p>
</Boundary>
