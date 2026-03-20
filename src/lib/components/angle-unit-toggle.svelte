<script lang="ts">
	import { Icon, Tooltip } from '@viamrobotics/prime-core';

	interface Props {
		useRadians: boolean;
		onToggle: () => void;
	}

	const { useRadians, onToggle }: Props = $props();
</script>

<Tooltip>
	<button
		onclick={onToggle}
		aria-label={useRadians ? 'Switch to Degrees' : 'Switch to Radians'}
		class="text-gray-6 hover:border-medium hover:bg-medium active:bg-gray-2 justify-items-end p-0.5"
	>
		<Icon
			name="sync"
			size="xs"
		/>
	</button>

	<span slot="description">
		{useRadians ? 'Switch to Degrees' : 'Switch to Radians'}
	</span>
</Tooltip>
