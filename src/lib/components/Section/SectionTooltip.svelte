<script lang="ts">
	import type { Snippet } from 'svelte'

	import { mdiInformationOutline } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

	interface Props {
		children: Snippet
	}

	const { children }: Props = $props()
</script>

<Tooltip>
	<Tooltip.Trigger>
		<Icon
			icon={mdiInformationOutline}
			class="text-gray-6"
			aria-label="More information"
			tabindex={0}
		/>
	</Tooltip.Trigger>
	<Tooltip.Content class="text-xs whitespace-pre-line">
		{@render children()}
	</Tooltip.Content>
</Tooltip>
