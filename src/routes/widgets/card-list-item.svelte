<script
	module
	lang="ts"
>
	const collapseAllCallbacks = new Set<() => void>()
	const expandAllCallbacks = new Set<() => void>()

	/** @returns A function that unregisters the callback. */
	export const registerCollapseAllCallback = (callback: () => void) => {
		collapseAllCallbacks.add(callback)
		return () => collapseAllCallbacks.delete(callback)
	}

	/** @returns A function that unregisters the callback. */
	export const registerExpandAllCallback = (callback: () => void) => {
		expandAllCallbacks.add(callback)
		return () => expandAllCallbacks.delete(callback)
	}

	export const collapseAll = () => {
		for (const callback of collapseAllCallbacks) {
			callback()
		}
	}

	export const expandAll = () => {
		for (const callback of expandAllCallbacks) {
			callback()
		}
	}
</script>

<script lang="ts">
	import { Breadcrumbs } from '@viamrobotics/prime-ui'
	import { robotApi } from '@viamrobotics/sdk'
	import ResourceIcon from '#lib/components/ResourceIcon.svelte'
	import DoCommandWidget from '#lib/components/widgets/DoCommand/DoCommand.svelte'
	import { getResourceAPI } from '#lib/get-resource-api.js'
	import { getResourceKey } from '#lib/get-resource-key.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { widgetsForResource } from '#lib/resource-widgets.js'
	import { type NamedResourceStatus, ResourceStatusText } from '#lib/resource.js'
	import { scrollIntoView } from '#lib/scroll-into-view.js'
	import { PersistedState } from 'runed'
	import { onDestroy } from 'svelte'

	import { resourceWidgetTitle } from '../resource-widget-title'
	import ResourceStatus from './resource-status.svelte'
	import SectionGroup from './section-group.svelte'

	interface Props {
		partID: string
		resource: NamedResourceStatus
		/** URL hash, including the `#` character */
		urlHash: string
	}

	const { partID, resource, urlHash }: Props = $props()

	const isTestCollapsed = $derived(
		new PersistedState(`control/${partID}/${getResourceKey(resource.name)}/test/collapse`, false)
	)

	const isDoCommandCollapsed = $derived(
		new PersistedState(
			`control/${partID}/${getResourceKey(resource.name)}/test/doCommand/collapse`,
			true
		)
	)

	const resourceName = $derived(resource.name.name)
	const namespace = $derived(resource.name.namespace)
	const type = $derived(resource.name.type)
	const subtype = $derived(resource.name.subtype)
	const widgets = $derived(Object.entries(widgetsForResource(resource.name)?.widgets ?? {}))
	const resourceAPI = $derived(getResourceAPI(resource.name))
	const id = $derived(encodeURIComponent(resourceName))
	// Exclude the # character
	const hash = $derived(urlHash.replace(/^#/iu, ''))

	const unregisterCollapseAll = registerCollapseAllCallback(() => {
		isTestCollapsed.current = true
		isDoCommandCollapsed.current = true
	})

	const unregisterExpandAll = registerExpandAllCallback(() => {
		isTestCollapsed.current = false
		isDoCommandCollapsed.current = false
	})

	let isActive = $state(false)
	let isActiveTimeout: number | undefined

	const setIsActive = () => {
		globalThis.clearTimeout(isActiveTimeout)
		isActive = true
		isActiveTimeout = window.setTimeout(() => {
			isActive = false
		}, 4000)
	}

	onDestroy(() => {
		unregisterCollapseAll()
		unregisterExpandAll()
		globalThis.clearTimeout(isActiveTimeout)
	})

	$effect(() => {
		if (id === hash) {
			setIsActive()
		} else {
			window.clearTimeout(isActiveTimeout)
			isActive = false
		}
	})
</script>

<li
	{id}
	class={[
		'-mx-0.5 w-full scroll-m-4 border-2 transition duration-300 ease-in-out',
		isActive ? 'border-[#CADAF7]' : 'border-transparent',
	]}
	aria-label={resourceName}
	use:scrollIntoView
>
	<div class="border-light border">
		<header class="border-light relative flex items-center gap-3 border-b px-3 py-2.5">
			<ResourceIcon {type} />
			<div class="flex min-w-0 grow flex-wrap items-center gap-x-3 gap-y-1.5">
				<span class="min-w-0 text-sm font-semibold wrap-break-word">{resourceName}</span>
				<Breadcrumbs class="max-w-full shrink-0">
					<Breadcrumbs.Item class="text-subtle-1">{namespace}</Breadcrumbs.Item>
					<Breadcrumbs.Separator />
					<Breadcrumbs.Item class="text-subtle-1">{type}</Breadcrumbs.Item>
					<Breadcrumbs.Separator />
					<Breadcrumbs.Item><Breadcrumbs.Page>{subtype}</Breadcrumbs.Page></Breadcrumbs.Item>
				</Breadcrumbs>
			</div>
			<div class="shrink-0">
				<ResourceStatus {resource} />
			</div>
		</header>
		{#if resource.state === robotApi.ResourceStatus_State.READY}
			<div class="flex flex-col divide-y">
				{#if widgets.length > 0}
					<SectionGroup
						isCollapsed={isTestCollapsed.current ?? false}
						toggleIsCollapsed={() => {
							isTestCollapsed.current = !isTestCollapsed.current
						}}
					>
						{#snippet title()}Widgets{/snippet}
						<div class="flex flex-col gap-4 p-4">
							{#each widgets as [key, { component: Widget }] (key)}
								<div class="flex flex-col gap-1">
									<span class="font-bold">{resourceWidgetTitle(resourceAPI, key)}</span>
									<Widget
										{partID}
										{resourceName}
									/>
								</div>
							{/each}
						</div>
					</SectionGroup>
				{/if}
				{#if resourceAPI !== ResourceTriplets.MLModel}
					<SectionGroup
						isCollapsed={isDoCommandCollapsed.current}
						toggleIsCollapsed={() => {
							isDoCommandCollapsed.current = !isDoCommandCollapsed.current
						}}
					>
						{#snippet title()}Do Command{/snippet}
						<DoCommandWidget
							{partID}
							resource={resource.name}
						/>
					</SectionGroup>
				{/if}
			</div>
		{:else}
			<div
				class="bg-medium flex h-10 animate-pulse items-center justify-center"
				role="progressbar"
			>
				<p class="text-heading">
					Resource is {ResourceStatusText[resource.state]}...
				</p>
			</div>
		{/if}
	</div>
</li>
