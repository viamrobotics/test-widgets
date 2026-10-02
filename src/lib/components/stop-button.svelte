<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	interface Props {
		onStop: () => void
	}

	const { onStop }: Props = $props()
</script>

<Button
	variant="outline-danger"
	class="font-roboto-mono w-fit uppercase"
	onclick={onStop}
>
	Stop
</Button>
