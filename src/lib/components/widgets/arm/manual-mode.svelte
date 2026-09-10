<script lang="ts">
	import { Button, Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'
	import StatusPill from '$lib/components/status-pill.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'

	import { useCountdown } from './use-countdown.svelte'

	interface Props {
		/** Inline heading at the start of the row, for hosts that render no section title. */
		title?: string
		isManualMode: boolean
		isPending: boolean
		setManualMode: (manualMode: boolean, enabledFor: number) => void
		lastError: Error | null
	}

	const { title, isManualMode, isPending, setManualMode, lastError }: Props = $props()

	let enabledFor = $state(90)
	let enableAfter = $state(20)
	let lastAction = $state<'enter' | 'exit' | undefined>()

	const countdown = useCountdown(() => {
		setManualMode(true, enabledFor)
	})

	const isEntering = $derived(countdown.isCounting || (isPending && lastAction === 'enter'))
	const isExiting = $derived(isPending && lastAction === 'exit')

	const enter = () => {
		lastAction = 'enter'
		countdown.start(enableAfter)
	}

	const exit = () => {
		if (countdown.isCounting) {
			countdown.cancel()
			return
		}
		if (isManualMode) {
			lastAction = 'exit'
			setManualMode(false, 0)
		}
	}
</script>

<div class="flex min-w-0 flex-col gap-2">
	<div class="flex flex-wrap items-center gap-3">
		{#if title}
			<h3 class="font-mono text-sm font-semibold">{title}</h3>
		{/if}
		<Button
			variant="dark"
			disabled={isPending || countdown.isCounting}
			progress={isEntering ? 'indeterminate' : undefined}
			onclick={enter}
		>
			Enter
		</Button>
		<Button
			variant="dark"
			disabled={isPending}
			progress={isExiting ? 'indeterminate' : undefined}
			onclick={exit}
		>
			Exit
		</Button>
		{#if countdown.isCounting}
			<span class="text-subtle-2 text-xs">Enabling in {countdown.secondsRemaining}s</span>
		{/if}
		<Label
			position="left"
			cx="max-w-fit gap-1 text-xs"
		>
			<span class="flex flex-row items-center gap-1 whitespace-nowrap">
				Enabled for (s)
				<Tooltip>
					<Icon
						name="information-outline"
						cx="text-gray-6"
					/>

					<p
						slot="description"
						class="text-xs"
					>
						How long manual mode stays enabled, in seconds. 0 means no time limit.
					</p>
				</Tooltip>
			</span>

			<span
				slot="input"
				class="w-20"
			>
				<NumericInput
					value={enabledFor}
					on:change={(event) => {
						enabledFor = numberValueFromEvent(event) ?? 0
					}}
				/>
			</span>
		</Label>
		<Label
			position="left"
			cx="max-w-fit gap-1 text-xs"
		>
			<span class="flex flex-row items-center gap-1 whitespace-nowrap">
				Enable after (s)
				<Tooltip>
					<Icon
						name="information-outline"
						cx="text-gray-6"
					/>

					<p
						slot="description"
						class="text-xs"
					>
						Countdown before manual mode is entered, in seconds. 0 enters immediately.
					</p>
				</Tooltip>
			</span>

			<span
				slot="input"
				class="w-20"
			>
				<NumericInput
					value={enableAfter}
					on:change={(event) => {
						enableAfter = numberValueFromEvent(event) ?? 0
					}}
				/>
			</span>
		</Label>
		<StatusPill
			isActive={isManualMode}
			activeText="Enabled"
			inactiveText="Disabled"
		/>
	</div>

	<p class="text-subtle-2 text-xs">
		Manual mode puts the arm into gravity compensation or servo release mode so the arm can be moved
		by hand.
	</p>

	<ErrorDisplay {lastError} />
</div>
