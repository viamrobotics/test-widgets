<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import { errorKey } from '$lib/components/section/error-key'
	import StatusLine from '$lib/components/status-line.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
		class?: ClassValue
		/**
		 * Draws the controls with no heading of their own, for a host that titles them, and adds
		 * their errors to the enclosing section's indicator. @default false
		 */
		isEmbedded?: boolean
	}

	const { partID, resourceName, class: className, isEmbedded = false }: Props = $props()

	type Action = 'open' | 'grab'

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const openMutation = createResourceMutation(client, 'open')
	const grabMutation = createResourceMutation(client, 'grab')

	const sectionErrors = useSectionErrors(() => ({
		mutations: [openMutation, grabMutation],
	}))

	// Open and Grab contradict each other, so one guard holds both. A press made while busy is dropped.
	const guard = createInFlightGuard()

	let activeAction = $state<Action | undefined>()
	let statusText = $state('')

	const isOpenBusy = $derived(guard.isBusy && activeAction === 'open')
	const isGrabBusy = $derived(guard.isBusy && activeAction === 'grab')

	const open = async () => {
		const outcome = await guard.run(() => {
			activeAction = 'open'
			statusText = 'Opening'
			return openMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		statusText = outcome === 'succeeded' ? 'Opened' : ''
	}

	const grab = async () => {
		const outcome = await guard.run(() => {
			activeAction = 'grab'
			statusText = 'Grabbing'
			return grabMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		// The SDK's Grab resolves with no value, so whether it closed on something is the Holding badge's to say.
		statusText = outcome === 'succeeded' ? 'Grab finished' : ''
	}
</script>

{#snippet controls()}
	<Section.Body>
		<div class="flex w-full min-w-0 flex-col gap-1">
			<div
				role="group"
				aria-label="Open and Grab"
				class="flex flex-wrap items-center gap-x-2 gap-y-1.5"
			>
				<button
					type="button"
					class="button button-xs"
					aria-busy={isOpenBusy}
					disabled={guard.isBusy && !isOpenBusy}
					aria-disabled={isOpenBusy ? true : undefined}
					onclick={open}
				>
					{#if isOpenBusy}
						<span
							class="progress-dots"
							aria-hidden="true"
						></span>
					{/if}
					Open
				</button>
				<button
					type="button"
					class="button button-xs"
					aria-busy={isGrabBusy}
					disabled={guard.isBusy && !isGrabBusy}
					aria-disabled={isGrabBusy ? true : undefined}
					onclick={grab}
				>
					{#if isGrabBusy}
						<span
							class="progress-dots"
							aria-hidden="true"
						></span>
					{/if}
					Grab
				</button>
			</div>
			<StatusLine text={statusText} />
		</div>
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
		class={['flex-col gap-3', className]}
	>
		<Section.Heading>
			<Section.Method
				method="Open"
				api={ResourceTriplets.Gripper}
			/>
			<span>/</span>
			<Section.Method
				method="Grab"
				api={ResourceTriplets.Gripper}
			/>
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>
		{@render controls()}
	</Section>
{/if}
