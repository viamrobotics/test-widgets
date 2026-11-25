<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { formatPowerReadout } from './motor-readout-format'

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

	const isPoweredQuery = createResourceQuery(client, 'isPowered', {
		refetchInterval: 500,
	})

	const labelId = $props.id()

	const isPowered = $derived(isPoweredQuery.data?.[0] === true)
	const powerFraction = $derived(isPoweredQuery.data?.[1] ?? 0)
	const readout = $derived(formatPowerReadout(isPowered, powerFraction))
</script>

<ApiSection
	method="IsPowered"
	api={ResourceTriplets.Motor}
	queries={[isPoweredQuery]}
	class="grow flex-col gap-1"
>
	{#snippet tooltip()}
		Returns whether or not the motor is running and the current portion of max power. Stepper motors
		will report “true” if they are being powered while holding a position and while they are
		turning.
	{/snippet}
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={labelId}
			class="text-subtle-1 text-xs"
		>
			Power
		</span>
		<span
			role="group"
			aria-labelledby={labelId}
			class="readout font-roboto-mono min-w-0"
		>
			<span class="readout-value inline-flex items-center gap-2">
				{#if isPoweredQuery.data !== undefined}
					<StatusDot
						state={isPowered ? 'success' : 'danger'}
						label={isPowered ? 'Powered' : 'Not powered'}
					/>
				{/if}
				{readout}
			</span>
		</span>
	</div>
</ApiSection>
