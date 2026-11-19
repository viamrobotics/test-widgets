<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Icon, StatusDot } from '@viamrobotics/prime-ui'
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const homeMutation = createResourceMutation(client, 'home')

	const isHomed = $derived(homeMutation.data)

	const homedLabelId = $props.id()
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="Home"
	api={ResourceTriplets.Gantry}
	mutations={[homeMutation]}
>
	<Section.Text>Run the homing sequence</Section.Text>
	<div class="flex">
		<button
			type="button"
			class="button button-compact"
			onclick={() => {
				homeMutation.mutate([], {})
			}}
		>
			<Icon
				icon={mdiPlayCircleOutline}
				size="sm"
			/>
			Execute
		</button>
	</div>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={homedLabelId}
			class="text-subtle-1 text-xs">Homed</span
		>
		<span
			role="group"
			aria-labelledby={homedLabelId}
			class="readout font-roboto-mono inline-flex items-center gap-2"
		>
			{#if isHomed === undefined}
				-
			{:else}
				<StatusDot
					state={isHomed ? 'success' : 'disabled'}
					label="Homed"
				/>
				{isHomed ? 'Yes' : 'No'}
			{/if}
		</span>
	</div>
</ApiSection>
