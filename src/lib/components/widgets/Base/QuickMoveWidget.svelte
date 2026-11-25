<script lang="ts">
	import { BaseClient, MachineConnectionEvent, type Vector3 } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		useConnectionStatus,
	} from '@viamrobotics/svelte-sdk'
	import { Section } from '#lib/components/Section/index.js'
	import { useSectionErrors } from '#lib/components/Section/use-section-errors.svelte.js'
	import { untrack } from 'svelte'

	import { useBaseState } from './base-state.svelte'
	import QuickMove from './QuickMove.svelte'

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

	const connectionStatus = useConnectionStatus(() => partID)
	const isConnected = $derived(connectionStatus.current === MachineConnectionEvent.CONNECTED)

	const quickSetPowerMutation = createResourceMutation(client, 'setPower')
	const stopMutation = createResourceMutation(client, 'stop')

	const { motion } = untrack(() => useBaseState(partID, resourceName))

	type Power = [linear: Vector3, angular: Vector3]

	// The drive power the held pads and keys ask for now. Undefined once everything is released.
	let heldPower: Power | undefined
	let sentPower: Power | undefined
	let isDriveInFlight = $state(false)

	// Another base widget's call holds the group, so a drive would contradict it.
	const isDriveBlocked = $derived(motion.isBusy && !isDriveInFlight)

	const isSameVector = (a: Vector3, b: Vector3) => a.x === b.x && a.y === b.y && a.z === b.z

	const isSamePower = (a: Power, b: Power) => isSameVector(a[0], b[0]) && isSameVector(a[1], b[1])

	const isZeroPower = (linear: Vector3, angular: Vector3) =>
		[linear, angular].every(({ x, y, z }) => x === 0 && y === 0 && z === 0)

	// A hold that changed while the last drive was in flight is sent once that drive settles. Only
	// the power held at that moment goes out, so nothing is stored and nothing fires after a release.
	const sendDrive = (power: Power) => {
		const outcome = motion.run(() => quickSetPowerMutation.mutateAsync(power))
		if (!outcome) {
			return
		}
		isDriveInFlight = true
		sentPower = power
		void outcome.then(() => {
			isDriveInFlight = false
			if (heldPower && sentPower && !isSamePower(heldPower, sentPower)) {
				sendDrive(heldPower)
			}
		})
	}

	// A zero power is a release, so it never joins the group and always sends. A drive's failure
	// reaches the section through the mutation.
	const quickSetPower = async (linear: Vector3, angular: Vector3) => {
		if (isZeroPower(linear, angular)) {
			heldPower = undefined
			await quickSetPowerMutation.mutateAsync([linear, angular])
			return
		}
		heldPower = [linear, angular]
		if (!isDriveInFlight) {
			sendDrive(heldPower)
		}
	}
	const stop = () => {
		heldPower = undefined
		stopMutation.mutate([], {})
	}

	const sectionErrors = useSectionErrors(() => ({
		mutations: [quickSetPowerMutation, stopMutation],
	}))
</script>

<Section
	errorReporter={sectionErrors}
	class="flex-col gap-2"
>
	<Section.Heading>
		Quick move
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>

	<Section.Body>
		<QuickMove
			setPower={quickSetPower}
			{stop}
			{isConnected}
			{isDriveBlocked}
		/>
	</Section.Body>
</Section>
