<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import ErrorDisplay from './error.svelte'

	interface Props {
		onStop: () => void
		error: Error | null
	}

	const { error, onStop }: Props = $props()
</script>

<Button
	variant="outline-danger"
	class="font-roboto-mono w-fit uppercase"
	onclick={onStop}
>
	Stop
</Button>
<ErrorDisplay lastError={error} />
