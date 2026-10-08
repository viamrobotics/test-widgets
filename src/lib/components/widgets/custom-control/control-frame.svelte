<script lang="ts">
	import type { Snippet } from 'svelte'

	import { useRobotClient } from '@viamrobotics/svelte-sdk'

	import Progress from '$lib/components/progress.svelte'
	import { prepareArtifact } from '$lib/custom-control/prepare-artifact'

	import { createControlHost } from './create-control-host.svelte'

	interface Props {
		partID: string
		resourceName: string
		html: string
		loading?: Snippet
	}

	const { partID, resourceName, html, loading }: Props = $props()

	const srcdoc = $derived(prepareArtifact(html))

	const robot = useRobotClient(() => partID)

	let iframe = $state<HTMLIFrameElement | null>(null)

	/**
	 * Set by the guest's first `size` report. Until then the `h-40` class sizes the frame, and
	 * `min-h-px`/`max-h-[80vh]` bound whatever the guest asks for.
	 */
	let height = $state<number>()

	const controlHost = createControlHost({
		getRobot: () => robot.current,
		getIframe: () => iframe ?? undefined,
		resourceName: () => resourceName,
		onHeight: (px) => {
			height = px
		},
	})

	// A throw from `start` propagates to the error boundary around this component.
	$effect(() => {
		controlHost.start()
		return controlHost.stop
	})
</script>

<div class="relative w-full">
	<iframe
		bind:this={iframe}
		sandbox="allow-scripts"
		{srcdoc}
		title="Custom control for {resourceName}"
		class="block h-40 max-h-[80vh] min-h-px w-full border-0"
		style:height={height === undefined ? undefined : `${height}px`}
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
