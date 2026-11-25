<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Checkbox, Field, Icon, Label } from '@viamrobotics/prime-ui'
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { useArmState } from './arm-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	// An emptied field reads as 0, which is no time limit.
	const EMPTY_FIELD_SECONDS = 0
	const DEFAULT_ENABLED_FOR_SECONDS = 90
	const MIN_ENABLED_FOR_SECONDS = 0
	const UNSUPPORTED_HINT = 'This arm does not support manual mode.'
	const ENABLED_FOR_HINT = `Enter a duration of ${MIN_ENABLED_FOR_SECONDS} seconds or more.`

	let isManualMode = $state(true)
	let enabledForSeconds = $state<number | undefined>(DEFAULT_ENABLED_FOR_SECONDS)

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the arm runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })
	const setManualModeMutation = createResourceMutation(client, 'setManualMode')
	const { manualMode: manualModeGuard } = untrack(() => useArmState(partID, resourceName))

	const supportsManualMode = $derived(propertiesQuery.data?.supportManualMode === true)

	const isEnabledForValid = $derived(
		enabledForSeconds === undefined || enabledForSeconds >= MIN_ENABLED_FOR_SECONDS
	)
	const canExecute = $derived(supportsManualMode && isEnabledForValid)

	const execute = () => {
		if (!canExecute) return
		void manualModeGuard.run(() =>
			setManualModeMutation.mutateAsync([isManualMode, enabledForSeconds ?? EMPTY_FIELD_SECONDS])
		)
	}

	const enabledForId = $props.id()
	const enabledForHintId = `${enabledForId}-hint`
	const unsupportedHintId = `${enabledForId}-unsupported`

	const isUnsupported = $derived(propertiesQuery.data !== undefined && !supportsManualMode)
	const executeDescribedBy = $derived.by(() => {
		if (isUnsupported) return unsupportedHintId
		if (!isEnabledForValid) return enabledForHintId
		return undefined
	})
</script>

{#snippet content()}
	<Field
		label="Manual mode"
		class="flex items-center gap-2"
	>
		<Checkbox
			bind:checked={isManualMode}
			disabled={!supportsManualMode}
		/>
		<Label />
	</Field>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={enabledForId}
			class="text-subtle-1 text-xs">Enabled for</span
		>
		<NumberField
			aria-labelledby={enabledForId}
			suffix="s"
			min={MIN_ENABLED_FOR_SECONDS}
			state={isEnabledForValid ? undefined : 'error'}
			aria-describedby={isEnabledForValid ? undefined : enabledForHintId}
			disabled={!supportsManualMode}
			class="min-w-16 flex-1"
			bind:value={enabledForSeconds}
		/>
	</div>
	{#if !isEnabledForValid}
		<p
			id={enabledForHintId}
			class="text-subtle-1 text-xs"
		>
			{ENABLED_FOR_HINT}
		</p>
	{/if}
{/snippet}

<ApiSection
	method="SetManualMode"
	api={ResourceTriplets.Arm}
	queries={[propertiesQuery]}
	mutations={[setManualModeMutation]}
	class="grow flex-col gap-4"
>
	<div
		role="group"
		aria-label="Manual mode"
		aria-describedby={isUnsupported ? unsupportedHintId : undefined}
		class="flex flex-col gap-4"
	>
		{@render content()}
	</div>
	{#if isUnsupported}
		<p
			id={unsupportedHintId}
			class="text-subtle-1 text-xs"
		>
			{UNSUPPORTED_HINT}
		</p>
	{/if}
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={!canExecute || manualModeGuard.isBusy}
			aria-describedby={executeDescribedBy}
			onclick={execute}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</ApiSection>
