<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useMotorState } from './motor-state.svelte'
	import SetPower from './SetPower.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const setPowerMutation = createResourceMutation(client, 'setPower')
	const { motion } = untrack(() => useMotorState(partID, resourceName))

	const setPower = (power: number) => {
		void motion.run(() => setPowerMutation.mutateAsync([power]))
	}
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="SetPower"
	api={ResourceTriplets.Motor}
	mutations={[setPowerMutation]}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<SetPower
			{setPower}
			isBusy={motion.isBusy}
		/>
	</div>
</ApiSection>
