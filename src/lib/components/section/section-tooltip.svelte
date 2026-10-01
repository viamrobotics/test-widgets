<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	interface Props {
		children: Snippet
	}

	const { children }: Props = $props()
</script>

<Tooltip>
	<Icon
		name="information-outline"
		cx="text-gray-6"
	/>

	<p
		slot="description"
		class="text-xs whitespace-pre-line"
	>
		{@render children()}
	</p>
</Tooltip>
