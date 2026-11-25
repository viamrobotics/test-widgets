<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { mdiPlayCircleOutline } from '@mdi/js'
	import { createMutation } from '@tanstack/svelte-query'
	import { Select } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { type streamApi, StreamClient } from '@viamrobotics/sdk'
	import { useRobotClient } from '@viamrobotics/svelte-sdk'

	import { assertExists } from '$lib/assert'
	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
		class?: ClassValue
	}

	const { partID, resourceName, class: className }: Props = $props()

	const robotClient = useRobotClient(() => partID)
	const streamClient = $derived(
		robotClient.current ? new StreamClient(robotClient.current) : undefined
	)

	let resolutionOptions = $state.raw<streamApi.Resolution[]>([])
	let selectedResolution = $state.raw<streamApi.Resolution>()

	$effect(() => {
		const client = streamClient
		const name = resourceName
		if (!client) return

		let isCurrent = true
		// getOptions answers an empty list when the camera has no options, so it does not reject.
		void client.getOptions(name).then((options) => {
			if (!isCurrent) return
			resolutionOptions = options
			selectedResolution = options[0]
		})

		return () => {
			isCurrent = false
		}
	})

	const resolutionKey = ({ width, height }: streamApi.Resolution) => `${width}x${height}`

	const resolutionItems = $derived(
		resolutionOptions.map((resolution) => ({
			value: resolutionKey(resolution),
			label: resolutionKey(resolution),
		}))
	)

	const getSelectedResolutionKey = () =>
		selectedResolution ? resolutionKey(selectedResolution) : undefined
	const selectResolution = (next: string | undefined) => {
		const match = resolutionOptions.find((resolution) => resolutionKey(resolution) === next)
		if (match) selectedResolution = match
	}

	const resolutionLabelId = $props.id()

	const resolutionMutation = createMutation(() => ({
		mutationKey: [partID, resourceName, 'setOptions'],
		mutationFn: async (resolution?: streamApi.Resolution) => {
			assertExists(streamClient, 'Expected stream client')
			if (resolution) {
				return streamClient.setOptions(resourceName, resolution.width, resolution.height)
			}
			return streamClient.resetOptions(resourceName)
		},
	}))
</script>

<ApiSection
	method="SetStreamOptions"
	api={ResourceTriplets.Camera}
	mutations={[resolutionMutation]}
	class={['flex-col gap-2 border-t', className]}
>
	{#snippet tooltip()}
		Change the resolution of the live stream video feed
	{/snippet}
	<div class="flex flex-wrap items-center gap-2">
		<div class="flex min-w-0 grow basis-56 items-center gap-2">
			<span
				id={resolutionLabelId}
				class="text-subtle-1 shrink-0 text-xs"
			>
				Resolution <span class="text-subtle-2">(width x height)</span>
			</span>
			<div class="max-w-50 min-w-0 flex-1">
				<Select
					items={resolutionItems}
					bind:value={getSelectedResolutionKey, selectResolution}
					disabled={resolutionOptions.length === 0}
					placeholder="Camera did not return resolution options"
					aria-labelledby={resolutionLabelId}
				/>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="button button-xs"
				onclick={() => {
					resolutionMutation.mutate(undefined)
				}}
			>
				Reset
			</button>
			<button
				type="button"
				class="button button-dark button-compact"
				disabled={resolutionOptions.length === 0}
				aria-busy={resolutionMutation.isPending}
				onclick={() => {
					if (selectedResolution) {
						resolutionMutation.mutate(selectedResolution)
					}
				}}
			>
				<Icon
					icon={mdiPlayCircleOutline}
					size="sm"
				/>
				Execute
			</button>
		</div>
	</div>
</ApiSection>
