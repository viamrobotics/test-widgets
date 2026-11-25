<!--
@component
The obstacle legend, docked over the map: along the bottom edge in a narrow pane, and along the
left edge, 250 px wide, from `@2xl`. Render it inside the map's positioned box, under an
`@container`. It is collapsed until its `Obstacles` header opens it.
-->
<script lang="ts">
	import type { ComponentProps } from 'svelte'

	import { Folder, Panel } from '@viamrobotics/prime-controls'

	import Legend from './legend.svelte'

	type Props = ComponentProps<typeof Legend>

	const props: Props = $props()

	let isOpen = $state(false)
</script>

<div
	class="absolute inset-x-0 bottom-0 z-10 flex max-h-full flex-col @2xl:top-0 @2xl:right-auto @2xl:bottom-auto @2xl:w-62.5"
>
	<Panel
		aria-label="Obstacles overlay"
		class="min-h-0"
	>
		<Folder
			title="Obstacles"
			bind:open={isOpen}
		>
			<div class="max-h-27.5 overflow-auto">
				<Legend {...props} />
			</div>
		</Folder>
	</Panel>
</div>
