<script
	module
	lang="ts"
>
	const collapseAllCallbacks: (() => void)[] = []
	const expandAllCallbacks: (() => void)[] = []

	export const registerCollapseAllCallback = (callback: () => void) => {
		collapseAllCallbacks.push(callback)
	}

	export const registerExpandAllCallback = (callback: () => void) => {
		expandAllCallbacks.push(callback)
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
	import { Breadcrumbs, Icon } from '@viamrobotics/prime-core'
	import { robotApi } from '@viamrobotics/sdk'
	import { PersistedState } from 'runed'
	import { slide } from 'svelte/transition'

	import ResourceIcon from '$lib/components/resource-icon.svelte'
	import SectionGroup from '$lib/components/section-group.svelte'
	import DoCommandWidget from '$lib/components/widgets/do-command/do-command.svelte'
	import { getResourceAPI } from '$lib/get-resource-api'
	import { getResourceKey } from '$lib/get-resource-key'
	import { type NamedResourceStatus, ResourceStatusText } from '$lib/resource'
	import { ResourceTriplets } from '$lib/resource-triplet'
	import { apiWidgetsForResource, widgetForResource } from '$lib/resource-widget'
	import { scrollIntoView } from '$lib/scroll-into-view'

	import ResourceStatus from './resource-status.svelte'

	interface Props {
		partID: string
		resource: NamedResourceStatus
		/** URL hash, including the `#` character */
		urlHash: string
		hasUnsavedChanges?: boolean
	}

	const { partID, resource, urlHash, hasUnsavedChanges = false }: Props = $props()

	// TODO: Move ui/src/lib/user-agent.ts to prime and use that here
	const isMacDevice = typeof navigator !== 'undefined' && /mac/iu.test(navigator.userAgent)
	const iconName = isMacDevice ? ('apple-keyboard-command' as const) : ('chevron-up' as const)
	const iconLabel = isMacDevice ? 'command' : 'control'

	const isTestCollapsed = $derived(
		new PersistedState(`control/${partID}/${getResourceKey(resource.name)}/test/collapse`, false)
	)

	const isDoCommandCollapsed = $derived(
		new PersistedState(
			`control/${partID}/${getResourceKey(resource.name)}/test/doCommand/collapse`,
			true
		)
	)

	const isApiWidgetsCollapsed = $derived(
		new PersistedState(
			`control/${partID}/${getResourceKey(resource.name)}/test/apiWidgets/collapse`,
			true
		)
	)

	const resourceName = $derived(resource.name.name)
	const namespace = $derived(resource.name.namespace)
	const type = $derived(resource.name.type)
	const subtype = $derived(resource.name.subtype)
	const ResourceTestView = $derived(widgetForResource(resource.name))
	const apiWidgets = $derived(apiWidgetsForResource(resource.name))
	const resourceAPI = $derived(getResourceAPI(resource.name))
	const id = $derived(encodeURIComponent(resourceName))
	// Exclude the # character
	const hash = $derived(urlHash.replace(/^#/iu, ''))

	registerCollapseAllCallback(() => {
		isTestCollapsed.current = true
		isDoCommandCollapsed.current = true
		isApiWidgetsCollapsed.current = true
	})

	registerExpandAllCallback(() => {
		isTestCollapsed.current = false
		isDoCommandCollapsed.current = false
		isApiWidgetsCollapsed.current = false
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
			<span class="text-sm font-semibold">{resourceName}</span>
			<Breadcrumbs crumbs={[namespace, type, subtype]} />
			<div class="ml-auto">
				<ResourceStatus {resource} />
			</div>
		</header>
		{#if hasUnsavedChanges}
			<div
				transition:slide={{ duration: 150 }}
				class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-amber-100 px-4 py-2 text-xs"
			>
				<p class="text-subtle-1 grow mix-blend-multiply">
					Testing last saved configuration. You have unsaved changes.
				</p>
				<div class="text-subtle-2 flex items-center mix-blend-multiply">
					<Icon
						name={iconName}
						size="xs"
					/>
					<span class="sr-only">{iconLabel}</span>
					<span class="font-roboto-mono">S</span>
					<p class="pl-1">to save</p>
				</div>
			</div>
		{/if}
		{#if resource.state === robotApi.ResourceStatus_State.READY}
			<div class="flex flex-col divide-y">
				{#if ResourceTestView}
					<SectionGroup
						title="Test"
						isCollapsed={isTestCollapsed.current ?? false}
						toggleIsCollapsed={() => {
							isTestCollapsed.current = !isTestCollapsed.current
						}}
					>
						<ResourceTestView
							{partID}
							{resourceName}
						/>
					</SectionGroup>
				{/if}
				{#if apiWidgets.length > 0}
					<SectionGroup
						title="API widgets"
						isCollapsed={isApiWidgetsCollapsed.current ?? true}
						toggleIsCollapsed={() => {
							isApiWidgetsCollapsed.current = !isApiWidgetsCollapsed.current
						}}
					>
						<div class="flex flex-col gap-4 p-4">
							{#each apiWidgets as { id: widgetId, widgets, label } (widgetId)}
								<div class="flex flex-col gap-1">
									<span class="font-bold">{label}</span>
									{#each widgets as Widget, index (index)}
										<Widget
											{partID}
											{resourceName}
										/>
									{/each}
								</div>
							{/each}
						</div>
					</SectionGroup>
				{/if}
				{#if resourceAPI !== ResourceTriplets.MLModel}
					<SectionGroup
						title="Do Command"
						isCollapsed={isDoCommandCollapsed.current}
						toggleIsCollapsed={() => {
							isDoCommandCollapsed.current = !isDoCommandCollapsed.current
						}}
					>
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
