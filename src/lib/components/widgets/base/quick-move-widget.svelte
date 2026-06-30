<script lang="ts">
	import { Label, Switch } from '@viamrobotics/prime-core'
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import MutationView from '$lib/components/mutation-view.svelte'

	import QuickMove from './quick-move.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	)

	const quickSetPowerMutation = createResourceMutation(client, 'setPower')

	const quickSetPower = (linear: Vector3, angular: Vector3) => {
		quickSetPowerMutation.mutate([linear, angular], {})
	}

	let isKeyboardEnabled = $state(false)

	const keyboardControlSwitchId = $derived(
		`base-quick-move-keyboard-control-switch-${partID}-${resourceName}`
	)
</script>

<MutationView lastError={quickSetPowerMutation.error}>
	{#snippet titleInput()}
		<div class="flex w-fit items-center gap-2">
			<Label
				cx="w-fit"
				for={keyboardControlSwitchId}
			>
				Keyboard control
			</Label>
			<Switch
				id={keyboardControlSwitchId}
				on={isKeyboardEnabled}
				on:change={() => (isKeyboardEnabled = !isKeyboardEnabled)}
			/>
		</div>
	{/snippet}

	<QuickMove
		setPower={quickSetPower}
		{isKeyboardEnabled}
	/>
</MutationView>
