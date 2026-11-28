<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useMotorState } from './motor-state.svelte'
	import SetRPM from './SetRpm.svelte'

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

	const setRPMMutation = createResourceMutation(client, 'setRPM')
	const { motion } = untrack(() => useMotorState(partID, resourceName))

	const setRPM = (rpm: number) => {
		void motion.run(() => setRPMMutation.mutateAsync([rpm]))
	}
</script>

<ApiSection
	class="flex-row flex-wrap gap-2"
	method="SetRPM"
	api={ResourceTriplets.Motor}
	mutations={[setRPMMutation]}
>
	<div class="flex grow flex-wrap justify-between gap-2">
		<SetRPM
			{setRPM}
			isBusy={motion.isBusy}
		/>
	</div>
</ApiSection>
