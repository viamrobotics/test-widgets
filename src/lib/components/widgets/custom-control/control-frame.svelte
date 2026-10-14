<script lang="ts">
	import type { Snippet } from 'svelte'

	import { useRobotClient } from '@viamrobotics/svelte-sdk'

	import Progress from '$lib/components/progress.svelte'

	import { createControlHost } from './create-control-host.svelte'
	import { prepareArtifact } from './custom-control'

	interface Props {
		partID: string
		resourceName: string
		html: string
		loading?: Snippet
	}

	const { partID, resourceName, html, loading }: Props = $props()

	const robot = useRobotClient(() => partID)
	const srcdoc = $derived(prepareArtifact(html))

	let iframe = $state<HTMLIFrameElement | null>(null)
	let height = $state<number>()

	const controlHost = createControlHost({
		getRobot: () => robot.current,
		getIframe: () => iframe ?? undefined,
		resourceName: () => resourceName,
		onHeight: (px) => {
			height = px
		},
	})

	$effect(() => {
		controlHost.start()
		return controlHost.stop
	})
</script>

<div class="relative w-full">
	<iframe
		bind:this={iframe}
		sandbox="allow-scripts"
		title="Custom control for {resourceName}"
		class="block h-40 max-h-[80vh] min-h-px w-full border-0"
		style:height={height === undefined ? undefined : `${height}px`}
		{srcdoc}
	></iframe>

	{#if height === undefined}
		<div class="bg-extralight absolute inset-0">
			{#if loading}
				{@render loading()}
			{:else}
				<Progress />
			{/if}
		</div>
	{/if}
</div>
