<!--
@component
Wraps a button that can be held back from acting. While `reason` is set, the button reads disabled
and says why: in a tooltip on focus or hover, and in its description for a screen reader. The
button keeps focus, since it takes `aria-disabled` and never `disabled`.

Spread the snippet's attributes on the button. The click handler still has to return early itself.

```svelte
<HeldBack reason={blockedReason}>
	{#snippet children(heldBack)}
		<button type="button" {...heldBack} onclick={execute}>Execute</button>
	{/snippet}
</HeldBack>
```
-->
<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Tooltip } from '@viamrobotics/prime-ui'

	interface HeldBackAttributes {
		'aria-disabled': true | undefined
		'aria-describedby': string | undefined
	}

	interface Props {
		/** Why the button will not act, as a sentence. `undefined` while it will. */
		reason: string | undefined
		/** The id of an element that already shows the reason. Set, no hidden copy is drawn. */
		reasonId?: string
		children: Snippet<[HeldBackAttributes]>
	}

	const { reason, reasonId: shownReasonId, children }: Props = $props()

	const hiddenReasonId = $props.id()
	const reasonId = $derived(shownReasonId ?? hiddenReasonId)

	const attributes = $derived<HeldBackAttributes>({
		'aria-disabled': reason === undefined ? undefined : true,
		'aria-describedby': reason === undefined ? undefined : reasonId,
	})
</script>

<Tooltip disabled={reason === undefined}>
	<Tooltip.Trigger>
		{@render children(attributes)}
	</Tooltip.Trigger>
	<Tooltip.Content class="max-w-72">{reason}</Tooltip.Content>
</Tooltip>
{#if reason !== undefined && shownReasonId === undefined}
	<!-- The tooltip is not in the page until it opens, so screen readers get the reason here. -->
	<span
		id={reasonId}
		class="sr-only">{reason}</span
	>
{/if}
