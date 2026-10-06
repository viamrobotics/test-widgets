<script lang="ts">
	import type {
		Arm,
		ArmClient,
		Base,
		BaseClient,
		Gantry,
		GantryClient,
		Gripper,
		GripperClient,
		Motor,
		MotorClient,
		Servo,
		ServoClient,
	} from '@viamrobotics/sdk'
	import type { Snippet } from 'svelte'
	import type { ClassValue } from 'svelte/elements'

	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import type { ResourceTriplet } from '$lib/resource-triplet'

	import ApiSection from './api-section.svelte'
	import Query from './query.svelte'
	import StatusPill from './status-pill.svelte'

	type Client =
		| typeof ArmClient
		| typeof BaseClient
		| typeof GantryClient
		| typeof GripperClient
		| typeof MotorClient
		| typeof ServoClient

	interface Props {
		client: Client
		partID: string
		resourceName: string
		api: ResourceTriplet
		children?: Snippet
		/** Classes for the section. Defaults to a column, as in a widget's sidebar. */
		class?: ClassValue
	}

	const {
		client: clientClass,
		partID,
		resourceName,
		api,
		children,
		class: className = 'grow flex-col gap-4',
	}: Props = $props()

	const client = $derived(
		createResourceClient<Arm | Base | Gantry | Gripper | Motor | Servo>(
			clientClass,
			() => partID,
			() => resourceName
		)
	)

	const query = $derived(createResourceQuery(client, 'isMoving', { refetchInterval: 500 }))
</script>

<ApiSection
	title="IsMoving"
	{api}
	bottomText="Updates automatically"
	class={className}
>
	<Query {query}>
		<StatusPill isActive={query.data ?? false} />
	</Query>

	<!-- slot for additional actuation info Ex: Motor's IsPowered & GetPosition -->
	{@render children?.()}
</ApiSection>
