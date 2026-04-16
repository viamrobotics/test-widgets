<script lang="ts">
	import { TooltipContainer, TooltipTarget, TooltipText } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'
	import ResourceIcon from '$lib/components/resource-icon.svelte'
	import { getResourceKey, type NamedResourceStatus } from '$lib/resource'

	interface Props {
		isLoading: boolean
		error: Error | null
		resources: NamedResourceStatus[]
		singleCardMode: boolean
		selectedResourceKey: string | undefined
		onselect: (key: string) => void
	}

	const { isLoading, error, resources, singleCardMode, selectedResourceKey, onselect }: Props =
		$props()

	const truncatedStates = $state<Record<string, boolean>>({})

	const observeTruncation = (node: HTMLDivElement, name: string) => {
		let currentName = name
		const check = () => {
			truncatedStates[currentName] = currentName.length > 0 && node.offsetWidth < node.scrollWidth
		}
		const ro = new ResizeObserver(check)
		ro.observe(node)
		check()
		return {
			destroy: () => ro.disconnect(),
			update: (newName: string) => {
				currentName = newName
				check()
			},
		}
	}

	const handleClick = (event: MouseEvent, resource: NamedResourceStatus) => {
		if (singleCardMode) {
			event.preventDefault()
			onselect(getResourceKey(resource.name))
		}
	}
</script>

<div class="flex flex-col gap-2 overflow-y-auto py-3">
	{#if isLoading}
		<div
			class="bg-medium mx-4 h-4 animate-pulse"
			role="progressbar"
		></div>
	{:else if error}
		<ErrorDisplay lastError={error} />
	{:else if resources}
		<ul>
			{#each resources as resource (getResourceKey(resource.name))}
				{@const { name, type } = resource.name}
				{@const key = getResourceKey(resource.name)}
				<li>
					<a
						href={`#${encodeURIComponent(name)}`}
						class="flex min-w-0 items-center gap-1.5 py-1 pr-3 pl-8.5 sm:pr-5 sm:pl-10.5
							{singleCardMode && selectedResourceKey === key
							? 'bg-ghost-medium'
							: 'hover:bg-ghost-light focus:bg-ghost-light active:bg-ghost-medium'}"
						onclick={(event) => handleClick(event, resource)}
					>
						<ResourceIcon {type} />
						<TooltipContainer hoverDelayMS={250}>
							<TooltipTarget class="min-w-0">
								<div
									use:observeTruncation={name}
									class="w-full truncate text-sm"
									aria-label={name}
								>
									{name}
								</div>
							</TooltipTarget>
							{#if truncatedStates[name]}
								<TooltipText
									location="top-start"
									cx="!max-w-min"
								>
									{name}
								</TooltipText>
							{/if}
						</TooltipContainer>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
