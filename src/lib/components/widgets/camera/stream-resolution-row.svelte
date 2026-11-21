<script lang="ts">
	import { createMutation } from '@tanstack/svelte-query'
	import { Select } from '@viamrobotics/prime-controls'
	import { type streamApi, StreamClient } from '@viamrobotics/sdk'
	import { useRobotClient } from '@viamrobotics/svelte-sdk'

	import { assertExists } from '$lib/assert'
	import { useReportedError } from '$lib/components/media-frame/use-reported-error.svelte'

	type ResolutionChange = { kind: 'set'; resolution: streamApi.Resolution } | { kind: 'reset' }

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

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

	const resolutionKey = ({ width, height }: streamApi.Resolution) => `${width} x ${height}`

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
		mutationFn: async (change: ResolutionChange) => {
			assertExists(streamClient, 'Expected stream client')
			if (change.kind === 'set') {
				return streamClient.setOptions(
					resourceName,
					change.resolution.width,
					change.resolution.height
				)
			}
			return streamClient.resetOptions(resourceName)
		},
	}))

	useReportedError(() => resolutionMutation.error)

	// Reset and Execute each set the stream's size, so one in flight holds both rather than racing them.
	const isSettingResolution = $derived(resolutionMutation.isPending)
	const hasOptions = $derived(resolutionOptions.length > 0)
	const isResettingResolution = $derived(
		isSettingResolution && resolutionMutation.variables?.kind === 'reset'
	)
	const isExecutingResolution = $derived(
		isSettingResolution && resolutionMutation.variables?.kind === 'set'
	)

	// The buttons stay focusable while a call is in flight, so a press then is dropped here.
	const resetResolution = () => {
		if (isSettingResolution) return
		resolutionMutation.mutate({ kind: 'reset' })
	}

	const executeResolution = () => {
		if (isSettingResolution || !selectedResolution) return
		resolutionMutation.mutate({ kind: 'set', resolution: selectedResolution })
	}
</script>

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
				disabled={!hasOptions}
				placeholder="Camera did not return resolution options"
				aria-labelledby={resolutionLabelId}
			/>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<button
			type="button"
			class="button button-xs"
			aria-disabled={isSettingResolution || undefined}
			aria-busy={isResettingResolution}
			onclick={resetResolution}
		>
			{#if isResettingResolution}
				<span
					class="progress-dots"
					aria-hidden="true"
				></span>
			{/if}
			Reset
		</button>
		<button
			type="button"
			class="button button-xs"
			aria-disabled={!hasOptions || isSettingResolution || undefined}
			aria-busy={isExecutingResolution}
			onclick={executeResolution}
		>
			{#if isExecutingResolution}
				<span
					class="progress-dots"
					aria-hidden="true"
				></span>
			{/if}
			Execute
		</button>
	</div>
</div>
