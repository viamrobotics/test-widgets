<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import MutationSection from '$lib/components/mutation-section.svelte'
	import Query from '$lib/components/query.svelte'
	import StopButton from '$lib/components/stop-button.svelte'
	import { formatNumeric } from '$lib/format'

	import GoFor from './go-for.svelte'
	import GoTo from './go-to.svelte'
	import QuickMove from './quick-move.svelte'
	import SetPower from './set-power.svelte'
	import SetRPM from './set-rpm.svelte'

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

	const propertiesQuery = createResourceQuery(client, 'getProperties', {
		refetchInterval: false,
	})

	const isPoweredQuery = createResourceQuery(client, 'isPowered', {
		refetchInterval: 500,
	})

	const positionQuery = createResourceQuery(client, 'getPosition', () => ({
		enabled: propertiesQuery.data?.positionReporting === true,
		refetchInterval: 500,
	}))

	const setPowerMutation = createResourceMutation(client, 'setPower')
	const quickSetPowerMutation = createResourceMutation(client, 'setPower')
	const setRPMMutation = createResourceMutation(client, 'setRPM')
	const goForMutation = createResourceMutation(client, 'goFor')
	const goToMutation = createResourceMutation(client, 'goTo')
	const stopMutation = createResourceMutation(client, 'stop')

	const setPower = (val: number) => {
		setPowerMutation.mutate([val], {})
	}

	const quickSetPower = (val: number) => {
		quickSetPowerMutation.mutate([val], {})
	}

	const setRPM = (val: number) => {
		setRPMMutation.mutate([val], {})
	}

	const goFor = (rpm: number, revolutions: number) => {
		goForMutation.mutate([rpm, revolutions], {})
	}

	const goTo = (rpm: number, pos: number) => {
		goToMutation.mutate([rpm, pos], {})
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex flex-row divide-x">
			<div class="flex w-full flex-col divide-y">
				<MutationSection
					title="Quick move"
					lastError={quickSetPowerMutation.error}
				>
					<QuickMove setPower={quickSetPower} />
				</MutationSection>
				<MutationSection
					title="SetPower"
					description="Move continuously"
					lastError={setPowerMutation.error}
				>
					<SetPower {setPower} />
				</MutationSection>
				{#if propertiesQuery.data?.positionReporting}
					<MutationSection
						title="SetRPM"
						description="Move indefinitely at a specified speed."
						lastError={setRPMMutation.error}
					>
						<SetRPM {setRPM} />
					</MutationSection>
					<MutationSection
						title="GoFor"
						description="Move a specified number of revolutions"
						lastError={goForMutation.error}
					>
						<GoFor {goFor} />
					</MutationSection>
					<MutationSection
						title="GoTo"
						description="Turn to a specified position"
						lastError={goToMutation.error}
					>
						<GoTo {goTo} />
					</MutationSection>
				{/if}
			</div>

			<div class="ml-auto flex w-full max-w-1/2 flex-col divide-y sm:max-w-1/3">
				<ApiSection title="Stop">
					<StopButton
						error={stopMutation.error}
						onStop={() => {
							stopMutation.mutate([])
						}}
					/>
				</ApiSection>
				<IsMoving
					client={MotorClient}
					{partID}
					{resourceName}
				>
					<div class="flex flex-col gap-6 pt-2">
						<ApiSection
							title="IsPowered"
							class="gap-3 p-0"
							tooltip="Returns whether or not the motor is running and the current portion of max power.

  Stepper motors will report ”true” if they are being powered while holding
  a position and while they are turning."
						>
							<Query
								contentCx="h-4"
								query={isPoweredQuery}
							>
								{#if isPoweredQuery.data !== undefined}
									{@const [isPowered, powerPct] = isPoweredQuery.data}
									<span class="font-roboto-mono flex flex-row gap-1 text-xs">
										<p class="text-default">{isPowered}</p>
										<p class="text-disabled">/</p>
										<p class="text-subtle-1">
											{formatNumeric(powerPct * 100, 1)}%
										</p>
									</span>
								{/if}
							</Query>
						</ApiSection>
						{#if propertiesQuery.data?.positionReporting === true}
							<ApiSection
								title="GetPosition"
								class="gap-3 p-0"
								tooltip="Reports the position of an encoded motor in revolutions from zero/home."
							>
								<Query
									contentCx=""
									query={positionQuery}
								>
									<p class="font-roboto-mono text-default text-xs">
										{formatNumeric(positionQuery.data, 4)}
									</p>
								</Query>
							</ApiSection>
						{/if}
					</div>
				</IsMoving>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
