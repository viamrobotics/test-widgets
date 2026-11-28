<script lang="ts">
	import HeldBack from '../../HeldBack.svelte'

	interface Props {
		reason: string | undefined
		reasonId?: string
	}

	const { reason, reasonId }: Props = $props()
</script>

{#if reasonId !== undefined}
	<p id={reasonId}>{reason}</p>
{/if}
<HeldBack
	{reason}
	{reasonId}
>
	{#snippet children(heldBack)}
		<button
			type="button"
			{...heldBack}>Execute</button
		>
	{/snippet}
</HeldBack>
