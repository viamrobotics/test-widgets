<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { ArmClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const UNSUPPORTED_HINT = 'This arm does not support manual mode.'
	const DOT_LABEL = 'Manual mode'
	const POLL_INTERVAL_MS = 1000

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the arm runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })
	const supportsManualMode = $derived(propertiesQuery.data?.supportManualMode === true)

	const manualModeQuery = createResourceQuery(client, 'getManualMode', () => ({
		refetchInterval: POLL_INTERVAL_MS,
		enabled: supportsManualMode,
	}))

	const isManualMode = $derived(supportsManualMode ? manualModeQuery.data : undefined)
	const manualModeText = $derived(isManualMode ? 'On' : 'Off')

	const labelId = $props.id()
	const hintId = `${labelId}-hint`
	const isUnsupported = $derived(propertiesQuery.data !== undefined && !supportsManualMode)
</script>

<ApiSection
	method="GetManualMode"
	api={ResourceTriplets.Arm}
	queries={[propertiesQuery, manualModeQuery]}
	class="grow flex-col gap-4"
>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={labelId}
			class="text-subtle-1 text-xs">Manual mode</span
		>
		<span
			role="group"
			aria-labelledby={labelId}
			aria-describedby={isUnsupported ? hintId : undefined}
			class="readout font-roboto-mono inline-flex items-center gap-2"
		>
			{#if isManualMode === undefined}
				{MISSING_VALUE}
			{:else}
				<StatusDot
					state={isManualMode ? 'success' : 'disabled'}
					label={DOT_LABEL}
				/>
				<span class="readout-value">{manualModeText}</span>
			{/if}
		</span>
	</div>
	{#if isUnsupported}
		<p
			id={hintId}
			class="text-subtle-1 text-xs"
		>
			{UNSUPPORTED_HINT}
		</p>
	{/if}
</ApiSection>
