<script lang="ts">
	import ErrorDisplay from '$lib/components/error.svelte'
	import { getResourceKey } from '$lib/get-resource-key'
	import { type NamedResourceStatus } from '$lib/resource'

	import CardListItem from './card-list-item.svelte'
	import NullState from './null-state.svelte'

	interface Props {
		partID: string
		isLoading: boolean
		error: Error | undefined
		resources: NamedResourceStatus[]
		urlHash: string
		hasUnsavedChanges?: boolean
	}

	const {
		partID,
		isLoading,
		error,
		resources,
		urlHash,
		hasUnsavedChanges = false,
	}: Props = $props()
</script>

<div class="p-6">
	{#if isLoading}
		<div
			class="bg-medium flex h-10 animate-pulse items-center justify-center"
			role="progressbar"
		>
			<p class="text-heading">Connecting to machine...</p>
		</div>
	{:else if error}
		<ErrorDisplay lastError={error} />
	{:else if resources.length === 0}
		<NullState />
	{:else}
		<ul class="flex flex-col gap-6">
			{#each resources as resource (getResourceKey(resource.name))}
				<CardListItem
					{resource}
					{partID}
					{urlHash}
					{hasUnsavedChanges}
				/>
			{/each}
		</ul>
	{/if}
</div>
