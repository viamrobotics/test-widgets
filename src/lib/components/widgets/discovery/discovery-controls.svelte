<script lang="ts">
	import { Progress } from '@viamrobotics/prime-ui'
	import { appRobotApi, DiscoveryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { SvelteMap } from 'svelte/reactivity'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '$lib/components/refetch-interval-store.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'

	import type { ComponentPreviewSnippet } from './component-preview'

	import ComponentPreviewFrame from './component-preview-frame.svelte'
	import DiscoveredResourceBlock from './discovered-resource-block.svelte'
	import { type DiscoveredResource, groupDiscoveries } from './group-discoveries'

	interface Props {
		partID: string
		resourceName: string
		/**  A handler for adding a component to the robot. */
		onAddComponent?: ((component: appRobotApi.ComponentConfig) => void) | undefined
		/** A snippet for creating component previews. Requires a `preview` DoCommand to be implemented. */
		componentPreview?: ComponentPreviewSnippet
	}

	const { partID, resourceName, onAddComponent, componentPreview }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'discovery-card',
		RefetchIntervals.MANUAL
	)

	const client = createResourceClient(
		DiscoveryClient,
		() => partID,
		() => resourceName
	)

	const discoveryQuery = createResourceQuery(client, 'discoverResources', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const resources = $derived(groupDiscoveries(discoveryQuery.data ?? []))
	const isNoneFound = $derived(discoveryQuery.data !== undefined && resources.length === 0)

	// The picked variant's name per resource name. A result without that variant falls back to the first.
	const pickedVariants = new SvelteMap<string, string>()

	const selectedIndex = (resource: DiscoveredResource) => {
		const picked = pickedVariants.get(resource.name)
		const index = resource.variants.findIndex((variant) => variant.name === picked)
		return Math.max(index, 0)
	}

	const selectVariant = (resource: DiscoveredResource, index: number) => {
		const variant = resource.variants[index]
		if (variant !== undefined) pickedVariants.set(resource.name, variant.name)
	}

	let copyError = $state<Error | null>(null)

	const copyText = async (text: string) => {
		try {
			await globalThis.navigator.clipboard.writeText(text)
			copyError = null
		} catch (error) {
			copyError = new Error('Could not copy to the clipboard', { cause: error })
		}
	}

	const copy = (text: string) => {
		void copyText(text)
	}

	const sectionErrors = useSectionErrors(() => ({
		queries: [discoveryQuery],
		mutations: [{ error: copyError }],
	}))
</script>

{#snippet preview(variant: appRobotApi.ComponentConfig)}
	{#if componentPreview}
		<ComponentPreviewFrame
			{partID}
			{resourceName}
			{variant}
			{componentPreview}
		/>
	{/if}
{/snippet}

<ConnectionStatus {partID}>
	{#snippet connected()}
		<!-- The container sits outside the section padding, so a 672 px pane reaches `@2xl`. -->
		<div class="@container min-w-0">
			<Section
				errorReporter={sectionErrors}
				class="min-w-0 flex-col gap-2 p-2"
			>
				<Section.Heading class="justify-between">
					Controls
					{#snippet aside()}
						<Section.Errors errors={sectionErrors.errors} />
					{/snippet}
				</Section.Heading>

				<div
					role="group"
					aria-label="Refresh discoveries"
					aria-busy={discoveryQuery.isFetching}
					class="flex min-w-0 items-center gap-1"
				>
					<div class="min-w-0 flex-1">
						<RefetchController
							{refetchInterval}
							queries={[discoveryQuery]}
						/>
					</div>
				</div>

				{#if discoveryQuery.isFetching}
					<Progress label="Discovering resources" />
				{/if}

				{#if isNoneFound}
					<p class="text-subtle-2 text-xs">No resources discovered</p>
				{/if}

				{#if resources.length > 0}
					<div
						class={['grid min-w-0 grid-cols-1 gap-2', resources.length > 1 && '@2xl:grid-cols-2']}
					>
						{#each resources as resource, index (`${resource.name}:${index}`)}
							<DiscoveredResourceBlock
								{resource}
								selectedIndex={selectedIndex(resource)}
								onSelect={(index) => {
									selectVariant(resource, index)
								}}
								onCopy={copy}
								{onAddComponent}
								preview={componentPreview ? preview : undefined}
							/>
						{/each}
					</div>
				{/if}
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
