<script lang="ts">
	import { InputControllerClient, type InputControllerEvent } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import type { RefetchInterval } from '$lib/components/refetch-interval-store.svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
		/** How often to poll. Unset, the widget polls every 500 ms and says so. A host passes its own rate. */
		refetchInterval?: RefetchInterval
	}

	const { partID, resourceName, refetchInterval }: Props = $props()

	const MISSING_VALUE = '-'
	const POLL_INTERVAL_MS = 500
	const BUTTON_CONTROL_PREFIX = 'Button'
	const PRESSED_VALUE = 1
	const MS_PER_SECOND = 1000
	const NANOS_PER_MS = 1_000_000
	const CLOCK_LOCALE = 'en-GB'
	const MILLISECOND_DIGITS = 3
	const CLOCK_FORMAT: Intl.DateTimeFormatOptions = {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	}

	const labelId = $props.id()

	const client = createResourceClient(
		InputControllerClient,
		() => partID,
		() => resourceName
	)

	const isHostPolling = $derived(refetchInterval !== undefined)

	const eventsQuery = createResourceQuery(client, 'getEvents', () => ({
		refetchInterval: refetchInterval ?? POLL_INTERVAL_MS,
	}))

	const sortedEvents = $derived(
		eventsQuery.data?.toSorted((a, b) => a.control.localeCompare(b.control))
	)
	const hasEvents = $derived(sortedEvents !== undefined && sortedEvents.length > 0)

	const isButton = (event: InputControllerEvent) => event.control.startsWith(BUTTON_CONTROL_PREFIX)

	const valueLabel = (event: InputControllerEvent) => {
		if (!isButton(event)) return String(event.value)
		return event.value === PRESSED_VALUE ? 'Pressed' : 'Released'
	}

	const timeLabel = (event: InputControllerEvent) => {
		if (event.time === undefined) return MISSING_VALUE
		const millis = Number(event.time.seconds) * MS_PER_SECOND + event.time.nanos / NANOS_PER_MS
		const date = new Date(millis)
		const clock = date.toLocaleTimeString(CLOCK_LOCALE, CLOCK_FORMAT)
		return `${clock}.${String(date.getMilliseconds()).padStart(MILLISECOND_DIGITS, '0')}`
	}
</script>

<ApiSection
	method="GetEvents"
	api={ResourceTriplets.InputController}
	queries={[eventsQuery]}
	class="grow flex-col gap-2"
>
	{#if !hasEvents}
		<div class="flex min-w-0 items-center gap-2">
			<span
				id={labelId}
				class="text-subtle-1 text-xs"
			>
				Events
			</span>
			<span
				role="group"
				aria-labelledby={labelId}
				class="readout font-roboto-mono"
			>
				<span class="readout-value">{MISSING_VALUE}</span>
			</span>
		</div>
	{:else if sortedEvents !== undefined}
		<dl class="font-roboto-mono flex flex-col gap-y-2 text-xs">
			{#each sortedEvents as event (event.control)}
				<div class="flex flex-col gap-1">
					<div class="flex min-w-0 items-center gap-2">
						<dt
							class="text-default w-28 shrink-0 truncate font-medium"
							title={event.control}
						>
							{event.control}
						</dt>
						<dd class="readout flex items-center gap-1">
							{#if isButton(event)}
								<span
									aria-hidden="true"
									class={[
										'size-2 rounded-full',
										event.value === PRESSED_VALUE ? 'bg-success-dark' : 'bg-disabled',
									]}
								></span>
							{/if}
							{valueLabel(event)}
						</dd>
					</div>
					<span class="text-subtle-1 wrap-break-word">
						{event.event}
						{timeLabel(event)}
					</span>
				</div>
			{/each}
		</dl>
	{/if}
	{#if !isHostPolling}
		<Section.Text class="mt-auto">Updates automatically</Section.Text>
	{/if}
</ApiSection>
