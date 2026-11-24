<script lang="ts">
	import { type ClosePopOut, usePopOutHost } from '$lib/components/pop-out/pop-out-host-context'

	const host = usePopOutHost()

	let close: ClosePopOut | undefined
	let hostCloseCount = $state(0)

	const open = () => {
		close = host?.open({
			title: 'arm-1 › Scene',
			minSize: { minWidth: 672, minHeight: 504 },
			content,
			onClose: () => {
				hostCloseCount += 1
			},
		})
	}
</script>

{#snippet content()}
	<p style="position: absolute; inset: 0; margin: 0">scene body</p>
{/snippet}

<button
	type="button"
	onclick={open}
>
	Open scene
</button>
<button
	type="button"
	onclick={() => close?.()}
>
	Close scene from control
</button>
<output aria-label="Host closes">{hostCloseCount}</output>
