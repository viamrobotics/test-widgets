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

	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import StopButton from './stop-button.svelte'

	interface Props {
		partID: string
		resourceName: string
		client:
			| typeof ArmClient
			| typeof BaseClient
			| typeof GantryClient
			| typeof GripperClient
			| typeof MotorClient
			| typeof ServoClient
	}

	const { partID, resourceName, client: clientClass }: Props = $props()

	const client = $derived(
		createResourceClient<Arm | Base | Gantry | Gripper | Motor | Servo>(
			clientClass,
			() => partID,
			() => resourceName
		)
	)

	const stopMutation = $derived(createResourceMutation(client, 'stop'))
</script>

<StopButton
	error={stopMutation.error}
	onStop={() => {
		stopMutation.mutate([])
	}}
/>
