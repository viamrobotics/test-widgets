<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import ClosedGripperSvg from './closed-gripper-svg.svelte'

	interface Props {
		onGrab: () => void
	}

	const { onGrab }: Props = $props()
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
