<script lang="ts">
	import { Label, Switch } from '@viamrobotics/prime-core'
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'

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
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	lastError={quickSetPowerMutation.error}
>
	{#snippet heading()}Quick move{/snippet}
	{#snippet input()}
		<Label cx="w-fit!">
			Keyboard control

			<Switch
				slot="input"
				on={isKeyboardEnabled}
				on:change={() => (isKeyboardEnabled = !isKeyboardEnabled)}
			/>
		</Label>
	{/snippet}

	<div class="flex grow flex-wrap justify-between gap-2">
		<QuickMove
			setPower={quickSetPower}
			{isKeyboardEnabled}
		/>
	</div>
</ApiSection>
