<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'

	import ClosedGripperSvg from './closed-gripper-svg.svelte'

	interface Props {
		onGrab: () => void
		lastError: Error | null
	}

	const { onGrab, lastError }: Props = $props()
</script>

<Button
	onclick={onGrab}
	class="w-20 p-3 py-3"
>
	<div class="flex flex-col gap-2">
		<ClosedGripperSvg />
		<p class="font-roboto-mono text-xs uppercase">grab</p>
	</div>
</Button>
<ErrorDisplay {lastError} />
