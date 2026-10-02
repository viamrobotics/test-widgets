<script lang="ts">
	import type * as SDK from '@viamrobotics/sdk'
	import type { HTMLAttributes } from 'svelte/elements'

	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import type { ResourceTriplet } from '$lib/resource-triplet'

	import ApiSection from './api-section.svelte'
	import { Section } from './section'
	import StatusPill from './status-pill.svelte'

	type Client =
		| typeof SDK.ArmClient
		| typeof SDK.BaseClient
		| typeof SDK.GantryClient
		| typeof SDK.GripperClient
		| typeof SDK.MotorClient
		| typeof SDK.ServoClient

	type Resource = SDK.Arm | SDK.Base | SDK.Gantry | SDK.Gripper | SDK.Motor | SDK.Servo

	interface Props extends HTMLAttributes<HTMLElement> {
		client: Client
		partID: string
		resourceName: string
		api: ResourceTriplet
	}

	const {
		client: clientClass,
		partID,
		resourceName,
		api,
		children,
		class: className,
	}: Props = $props()

	const client = $derived(
		createResourceClient<Resource>(
			clientClass,
			() => partID,
			() => resourceName
		)
	)

	const query = $derived(createResourceQuery(client, 'isMoving', { refetchInterval: 500 }))
</script>

<ApiSection
	class={['grow flex-col gap-4', className]}
	method="IsMoving"
	queries={[query]}
	{api}
>
	<StatusPill isActive={query.data ?? false} />
	{@render children?.()}
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
