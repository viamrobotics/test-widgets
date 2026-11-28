<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import Grab from './Grab.svelte'
	import Open from './Open.svelte'

	interface Props {
		partID: string
		resourceName: string
		class?: ClassValue
	}

	const { partID, resourceName, class: className }: Props = $props()

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
</script>

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

	<Section.Body>
		<div class="flex flex-wrap gap-4">
			<Open onOpen={() => openMutation.mutate([], {})} />
			<Grab onGrab={() => grabMutation.mutate([], {})} />
		</div>
	</Section.Body>
</Section>
