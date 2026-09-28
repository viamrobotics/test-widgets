<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import OpenGripperSvg from './open-gripper-svg.svelte'

	interface Props {
		onOpen: () => void
	}

	const { onOpen }: Props = $props()
</script>

<Button
	onclick={onOpen}
	class="w-20 p-3 py-3"
>
	<div class="flex flex-col gap-2">
		<OpenGripperSvg />
		<p class="font-roboto-mono text-xs uppercase">open</p>
	</div>
</Button>
