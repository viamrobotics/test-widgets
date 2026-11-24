<!--
@component
Shows `content` in a window beside the docked widget. With a pop-out host provided, the host owns the
window. Without one, a prime-ui `Takeover` fills the viewport. It renders no trigger, so the caller
owns the button and sets `open`.

```svelte
<PopOut title="arm-1 › Scene" minSize={{ minWidth: 480, minHeight: 320 }} bind:open>
	{#snippet content()}...{/snippet}
</PopOut>
```
-->
<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Takeover } from '@viamrobotics/prime-ui'
	import { untrack } from 'svelte'

	import { type PopOutSize, usePopOutHost } from './pop-out-host-context'

	interface Props {
		/** The window's title. */
		title: string
		/** The window body's smallest box in px. */
		minSize: PopOutSize
		/** Whether the window is open. Closing from the window's own chrome sets it to `false`. */
		open?: boolean
		/** What the window renders. It fills the window body. */
		content: Snippet
	}

	let { title, minSize, open = $bindable(false), content }: Props = $props()

	const host = usePopOutHost()

	$effect(() => {
		if (!host || !open) return

		let wasClosedByHost = false
		const close = untrack(() =>
			host.open({
				title,
				minSize,
				content,
				onClose: () => {
					wasClosedByHost = true
					open = false
				},
			})
		)

		return () => {
			if (!wasClosedByHost) close()
		}
	})
</script>

{#if !host}
	<Takeover bind:open>
		<Takeover.Content>
			<Takeover.Header>
				<Takeover.Title>{title}</Takeover.Title>
				<Takeover.Close />
			</Takeover.Header>
			<div
				class="relative min-h-0 flex-1"
				style:min-width="{minSize.minWidth}px"
				style:min-height="{minSize.minHeight}px"
			>
				{@render content()}
			</div>
		</Takeover.Content>
	</Takeover>
{/if}
