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

	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import { apiDocsHref } from '$lib/api-docs-href'

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
		api: string
		children?: Snippet
	}

	const { client: clientClass, partID, resourceName, api, children }: Props = $props()

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
	method="isMoving"
	href={apiDocsHref(api, 'isMoving')}
	bottomText="Updates automatically"
	class="grow"
>
	<Query
		{query}
		contentCx="h-5"
	>
		<StatusPill isActive={query.data ?? false} />
	</Query>

	<!-- slot for additional actuation info Ex: Motor's IsPowered & GetPosition -->
	{@render children?.()}
</ApiSection>
