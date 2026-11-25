<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { toError } from './to-error'

	interface Props {
		partID: string
		resourceName: string
	}

	interface StreamedTick {
		pinName: string
		high: boolean
		time: number
	}

	interface KeyedTick extends StreamedTick {
		key: number
	}

	const { partID, resourceName }: Props = $props()

	const INTERRUPTS_PLACEHOLDER = 'd1, d2'
	const INTERRUPTS_HINT = 'Separate names with commas'
	const MAX_TICKS = 20
	const NANOSECONDS_PER_MILLISECOND = 1_000_000
	const TWO_DIGITS = 2
	const THREE_DIGITS = 3

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	let interruptNames = $state('')
	let isStreaming = $state(false)
	let streamError = $state<Error | null>(null)
	let controller = $state.raw<AbortController>()
	let nextTickKey = 0
	const queue = $state<KeyedTick[]>([])

	const streamState = {
		get error() {
			return streamError
		},
	}

	const interrupts = $derived(
		interruptNames
			.split(',')
			.map((name) => name.trim())
			.filter((name) => name !== '')
	)
	const canStart = $derived(client.current !== undefined && !isStreaming && interrupts.length > 0)
	const newestFirst = $derived(queue.toReversed())

	// The SDK pushes each tick onto the array it is given, so the sink keys it and keeps the tail.
	const createTickSink = (signal: AbortSignal) => {
		const sink: StreamedTick[] = []
		sink.push = (...ticks) => {
			if (signal.aborted) return queue.length
			for (const tick of ticks) {
				queue.push({ ...tick, key: nextTickKey })
				nextTickKey += 1
			}
			if (queue.length > MAX_TICKS) queue.splice(0, queue.length - MAX_TICKS)
			return queue.length
		}
		return sink
	}

	const pad = (value: number, width: number) => String(value).padStart(width, '0')

	const timeOfDay = (nanoseconds: number) => {
		const date = new Date(nanoseconds / NANOSECONDS_PER_MILLISECOND)
		const clock = [date.getHours(), date.getMinutes(), date.getSeconds()]
			.map((part) => pad(part, TWO_DIGITS))
			.join(':')
		return `${clock}.${pad(date.getMilliseconds(), THREE_DIGITS)}`
	}

	const start = async () => {
		const board = client.current
		if (board === undefined || !canStart) return

		const current = new AbortController()
		controller = current
		isStreaming = true
		streamError = null
		queue.length = 0

		try {
			await board.streamTicks(
				interrupts,
				createTickSink(current.signal),
				{},
				{ ...board.callOptions, signal: current.signal }
			)
		} catch (error) {
			if (!current.signal.aborted) {
				streamError = toError(error)
			}
		} finally {
			if (controller === current) {
				controller = undefined
				isStreaming = false
			}
		}
	}

	const stop = () => {
		controller?.abort()
		controller = undefined
		isStreaming = false
	}

	$effect(() => {
		void partID
		void resourceName
		return () => controller?.abort()
	})
</script>

<ApiSection
	class="flex-col gap-2"
	method="StreamTicks"
	api={ResourceTriplets.Board}
	mutations={[streamState]}
>
	<TextField
		label="Digital interrupts"
		placeholder={INTERRUPTS_PLACEHOLDER}
		hint={INTERRUPTS_HINT}
		disabled={isStreaming}
		bind:value={interruptNames}
	/>
	<div class="flex items-center gap-2">
		<button
			type="button"
			class="button button-compact"
			disabled={!canStart}
			onclick={start}
		>
			Start
		</button>
		<button
			type="button"
			class="button button-compact"
			disabled={!isStreaming}
			onclick={stop}
		>
			Stop
		</button>
	</div>
	{#if newestFirst.length > 0}
		<ul
			aria-label="Last {MAX_TICKS} ticks, newest first"
			class="flex flex-col gap-1"
		>
			{#each newestFirst as tick (tick.key)}
				<li class="font-roboto-mono flex items-center gap-2 text-xs">
					<span class="min-w-0 flex-1 truncate">{tick.pinName}</span>
					<span class="inline-flex w-10 items-center gap-1">
						<StatusDot
							state={tick.high ? 'success' : 'disabled'}
							label="{tick.pinName} level"
						/>
						{tick.high ? 'High' : 'Low'}
					</span>
					<span class="text-subtle-2 w-24 flex-none text-right">{timeOfDay(tick.time)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</ApiSection>
