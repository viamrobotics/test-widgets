<script lang="ts">
	import { Progress } from '@viamrobotics/prime-ui'
	import { appRobotApi, DiscoveryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import { SvelteMap } from 'svelte/reactivity'

	import type { ComponentPreviewSnippet } from './component-preview'

	import ComponentPreviewFrame from './ComponentPreviewFrame.svelte'
	import DiscoveredResourceBlock from './DiscoveredResourceBlock.svelte'
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
		'discovery/discoverResources',
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

	// Two models can each yield a resource of one name, so a block is known by its API and model too.
	// The count sets apart results that repeat all three.
	const keyedResources = $derived.by(() => {
		const seen = new Map<string, number>()
		return resources.map((resource) => {
			const identity = JSON.stringify([resource.api, resource.model, resource.name])
			const occurrence = seen.get(identity) ?? 0
			seen.set(identity, occurrence + 1)
			return { resource, key: `${identity}:${occurrence}` }
		})
	})
	const isNoneFound = $derived(discoveryQuery.data !== undefined && resources.length === 0)

	// The picked variant's name per block key. A result without that variant falls back to the first.
	const pickedVariants = new SvelteMap<string, string>()

	const selectedIndex = (resource: DiscoveredResource, key: string) => {
		const picked = pickedVariants.get(key)
		const index = resource.variants.findIndex((variant) => variant.name === picked)
		return Math.max(index, 0)
	}

	const selectVariant = (resource: DiscoveredResource, key: string, index: number) => {
		const variant = resource.variants[index]
		if (variant !== undefined) pickedVariants.set(key, variant.name)
	}

	// A pick belongs to one discovery service, so it does not carry to another.
	$effect.pre(() => {
		void partID
		void resourceName
		pickedVariants.clear()
	})

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
					Resource preview
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
						{#each keyedResources as { resource, key } (key)}
							<DiscoveredResourceBlock
								{resource}
								selectedIndex={selectedIndex(resource, key)}
								onSelect={(index) => {
									selectVariant(resource, key, index)
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
