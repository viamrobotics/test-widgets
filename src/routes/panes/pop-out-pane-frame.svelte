<!--
@component
The chrome around a pop-out window: a title that drags the window, a Close button, and a body the
control's content fills edge to edge. A pop-out always floats, so the frame offers no Dock.
-->
<script lang="ts">
	import type { Snippet } from 'svelte'

	import { mdiClose } from '@mdi/js'
	import { Panes } from '@viamrobotics/prime-panes'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		paneId: string
		title: string
		/** What the control asked the window to render. */
		content: Snippet | undefined
		/** Called when the user closes the window from its own chrome. */
		onclose: () => void
	}

	const { paneId, title, content, onclose }: Props = $props()
</script>

<div
	data-pane-id={paneId}
	class="border-light text-default flex size-full flex-col border bg-white text-xs"
>
	<Panes.DragTrigger target="float">
		<div
			data-pane-header
			class="border-light bg-light flex min-w-0 cursor-grab items-center gap-1 border-b px-2 py-1 active:cursor-grabbing"
		>
			<h2 class="min-w-0 flex-1 truncate px-1 font-semibold">{title}</h2>
			<button
				type="button"
				aria-label="Close {title}"
				class="icon-button size-6 shrink-0"
				data-pane-focus
				onclick={onclose}
			>
				<Icon
					icon={mdiClose}
					size="sm"
				/>
			</button>
		</div>
	</Panes.DragTrigger>
	<div class="relative min-h-0 flex-1">
		{@render content?.()}
	</div>
</div>
