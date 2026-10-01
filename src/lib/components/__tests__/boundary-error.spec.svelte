<script lang="ts">
	import Boundary from '../boundary.svelte'

	const throwError = (): string => {
		throw new Error('test error')
	}
</script>

<Boundary>
	{@const message = throwError()}
	<p>{message}</p>
</Boundary>
