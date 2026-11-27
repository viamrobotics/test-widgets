<script lang="ts">
	import { Folder } from '@viamrobotics/prime-controls'
	import { DiscoveryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import CopyButton from '#lib/components/CopyButton.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import ReadoutRow from '#lib/components/ReadoutRow.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		DiscoveryClient,
		() => partID,
		() => resourceName
	)

	// Disabled so nothing is fetched until the button is pressed.
	const discoverQuery = createResourceQuery(client, 'discoverResources', () => ({
		enabled: false,
		refetchInterval: false,
	}))

	const isBusy = $derived(discoverQuery.isFetching)

	const BUSY_REASON = 'Wait for the discovery in flight to finish.'

	// The service whose last discovery failed, so the failure does not show against another one.
	const target = $derived(JSON.stringify([partID, resourceName]))
	let failedTarget = $state<string>()
	const hasLastDiscoveryFailed = $derived(failedTarget === target)

	// The button stays focusable while a discovery is in flight, so a press then is dropped here.
	const discover = async () => {
		if (isBusy) return
		const pressedTarget = target
		failedTarget = undefined
		const { error } = await discoverQuery.refetch()
		if (error) failedTarget = pressedTarget
	}

	const statusText = $derived.by(() => {
		if (isBusy) return 'Discovering resources.'
		return hasLastDiscoveryFailed ? 'Discover resources failed' : ''
	})

	const configs = $derived(
		(discoverQuery.data ?? []).toSorted((a, b) => a.name.localeCompare(b.name))
	)

	const allConfigsJson = $derived(
		JSON.stringify(
			configs.map((config) => config.toJson()),
			null,
			2
		)
	)

	const configJson = (config: (typeof configs)[number]) => JSON.stringify(config.toJson(), null, 2)

	const attributesJson = (config: (typeof configs)[number]) =>
		JSON.stringify({ attributes: config.attributes?.toJson() ?? {} }, null, 2)

	const countText = $derived(discoverQuery.data && String(configs.length))
</script>

<ApiSection
	method="DiscoverResources"
	api={ResourceTriplets.Discovery}
	queries={[discoverQuery]}
	class="grow flex-col gap-2"
>
	{#snippet tooltip()}
		Discover resources that can be added to the machine's config
	{/snippet}
	<div class="flex flex-col gap-2">
		<div class="flex">
			<HeldBack reason={isBusy ? BUSY_REASON : undefined}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-compact"
						{...heldBack}
						onclick={discover}
					>
						Discover resources
					</button>
				{/snippet}
			</HeldBack>
		</div>
		<StatusLine text={statusText} />
	</div>

	<ReadoutRow
		label="Found"
		value={countText}
	>
		{#if configs.length > 0}
			<CopyButton
				data={allConfigsJson}
				ariaLabel="Copy JSON"
			/>
		{/if}
	</ReadoutRow>

	{#if discoverQuery.data !== undefined && configs.length === 0}
		<p class="text-subtle-2 text-xs">No resources discovered</p>
	{/if}

	{#if configs.length > 0}
		<div class="flex min-w-0 flex-col gap-2">
			{#each configs as config, index (`${config.name}:${index}`)}
				<Folder
					title={config.name}
					open={index === 0}
				>
					<div class="flex min-w-0 flex-col gap-2">
						<div class="flex flex-col gap-0.5">
							<span class="text-subtle-1 font-roboto-mono text-xs wrap-anywhere">{config.api}</span>
							<span class="text-subtle-1 font-roboto-mono text-xs wrap-anywhere"
								>{config.model}</span
							>
						</div>
						<div class="relative min-w-0">
							<pre
								class="border-medium bg-light text-subtle-1 font-roboto-mono min-w-0 border py-2 pr-10 pl-3 text-xs break-all whitespace-pre-wrap"><code
									>{attributesJson(config)}</code
								></pre>
							<div class="absolute top-1 right-1">
								<CopyButton
									data={configJson(config)}
									ariaLabel={`Copy ${config.name} JSON`}
								/>
							</div>
						</div>
					</div>
				</Folder>
			{/each}
		</div>
	{/if}
</ApiSection>
