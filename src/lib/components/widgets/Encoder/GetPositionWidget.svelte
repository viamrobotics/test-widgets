<script lang="ts">
	import { Select } from '@viamrobotics/prime-controls'
	import { EncoderClient, EncoderPositionType } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { getEncoderPositionArgs } from './encoder-position-type'
	import Position from './Position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const POSITION_TYPE_ITEMS = [
		{ value: String(EncoderPositionType.UNSPECIFIED), label: 'Unspecified' },
		{ value: String(EncoderPositionType.TICKS_COUNT), label: 'Ticks count' },
		{ value: String(EncoderPositionType.ANGLE_DEGREES), label: 'Angle degrees' },
	]

	const positionTypeLabelId = $props.id()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'encoder/getPosition'
	)

	const client = createResourceClient(
		EncoderClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	// Until the person picks a type, the request names one the encoder says it supports.
	let chosenPositionType = $state<EncoderPositionType>()
	const positionType = $derived(
		chosenPositionType ?? getEncoderPositionArgs(propertiesQuery.data)[0]
	)

	const getPositionTypeItem = () => String(positionType)
	const choosePositionType = (next: string | undefined) => {
		const item = POSITION_TYPE_ITEMS.find(({ value }) => value === next)
		if (item === undefined) return
		chosenPositionType = Number(item.value)
	}

	// An encoder whose properties cannot be read is asked for the type the field shows, unspecified.
	const isPositionTypeSettled = $derived(
		chosenPositionType !== undefined ||
			propertiesQuery.data !== undefined ||
			propertiesQuery.isError
	)

	const positionQuery = createResourceQuery(
		client,
		'getPosition',
		(): [EncoderPositionType] => [positionType],
		() => ({
			enabled: isPositionTypeSettled,
			refetchInterval: refetchInterval.current,
		})
	)
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.Encoder}
	queries={[propertiesQuery, positionQuery]}
	class="grow flex-col gap-4"
>
	{#snippet tooltip()}
		Relative encoders return ticks since last zeroing. Absolute encoders return degrees.
	{/snippet}
	<div class="flex flex-col gap-1">
		<span
			id={positionTypeLabelId}
			class="text-subtle-1 text-xs"
		>
			Position type
		</span>
		<Select
			items={POSITION_TYPE_ITEMS}
			bind:value={getPositionTypeItem, choosePositionType}
			aria-labelledby={positionTypeLabelId}
		/>
	</div>
	<Position data={positionQuery.data} />
	<div class="mt-auto">
		<RefetchController
			{refetchInterval}
			queries={[positionQuery]}
		/>
	</div>
</ApiSection>
