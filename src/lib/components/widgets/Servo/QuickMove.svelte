<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	interface Props {
		currentPosition: number
		moveTo: (angle: number) => void
	}

	const { currentPosition, moveTo }: Props = $props()
</script>

<div class="flex flex-row gap-4 text-xs">
	<Button
		onclick={() => moveTo(currentPosition - 5)}
		aria-label="minus-five-degrees"
		icon="minus"
		disabled={currentPosition - 5 < 0}
	>
		5
		<abbr class="text-subtle-2">º</abbr>
	</Button>
	<Button
		onclick={() => moveTo(currentPosition + 5)}
		aria-label="plus-five-degrees"
		icon="plus"
	>
		5
		<abbr class="text-subtle-2">º</abbr>
	</Button>
</div>
