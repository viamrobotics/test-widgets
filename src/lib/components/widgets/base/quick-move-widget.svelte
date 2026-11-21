<script lang="ts">
	import { BaseClient, MachineConnectionEvent, type Vector3 } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		useConnectionStatus,
	} from '@viamrobotics/svelte-sdk'

	import { Section } from '$lib/components/section'
	import { errorKey } from '$lib/components/section/error-key'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'

	import QuickMove from './quick-move.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * Draws the controls with no heading of their own, for a host that titles them, and adds
		 * their errors to the enclosing section's indicator. @default false
		 */
		isEmbedded?: boolean
	}

	const { partID, resourceName, isEmbedded = false }: Props = $props()

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	)

	const connectionStatus = useConnectionStatus(() => partID)
	const isConnected = $derived(connectionStatus.current === MachineConnectionEvent.CONNECTED)

	const quickSetPowerMutation = createResourceMutation(client, 'setPower')
	const stopMutation = createResourceMutation(client, 'stop')

	const quickSetPower = (linear: Vector3, angular: Vector3) =>
		quickSetPowerMutation.mutateAsync([linear, angular])

	const stop = () => {
		stopMutation.mutate([], {})
	}

	const sectionErrors = useSectionErrors(() => ({
		mutations: [quickSetPowerMutation, stopMutation],
	}))
</script>

{#snippet controls()}
	<Section.Body>
		<QuickMove
			setPower={quickSetPower}
			{stop}
			{isConnected}
		/>
	</Section.Body>
{/snippet}

{#if isEmbedded}
	{#each sectionErrors.errors as error (errorKey(error))}
		<Section.Error {error} />
	{/each}
	{@render controls()}
{:else}
	<Section
		errorReporter={sectionErrors}
		class="flex-col gap-2"
	>
		<Section.Heading>
			Quick move
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>

		{@render controls()}
	</Section>
{/if}
