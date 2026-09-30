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

	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from './api-section.svelte'
	import StopButton from './stop-button.svelte'

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

	const stopMutation = $derived(createResourceMutation(client, 'stop'))
</script>

<ApiSection
	title="Stop"
	{api}
>
	<StopButton
		error={stopMutation.error}
		onStop={() => {
			stopMutation.mutate([])
		}}
	/>

	<!-- slot for additional actuation info Ex: Motor's IsPowered & GetPosition -->
	{@render children?.()}
</ApiSection>
