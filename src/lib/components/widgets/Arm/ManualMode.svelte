<script lang="ts">
	import { mdiInformationOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'

	import { useCountdown } from './use-countdown.svelte'

	interface Props {
		isManualMode: boolean
		isPending: boolean
		setManualMode: (manualMode: boolean, enabledFor: number) => void
	}

	const { isManualMode, isPending, setManualMode }: Props = $props()

	// An emptied field reads as 0: no time limit for Enable for, no delay for Enable after.
	const EMPTY_FIELD_SECONDS = 0

	let enabledFor = $state<number | undefined>(90)
	let enableAfter = $state<number | undefined>(5)
	let lastAction = $state<'enter' | 'exit' | undefined>()

	const countdown = useCountdown(() => {
		setManualMode(true, enabledFor ?? EMPTY_FIELD_SECONDS)
	})

	const isEntering = $derived(countdown.isCounting || (isPending && lastAction === 'enter'))
	const isExiting = $derived(isPending && lastAction === 'exit')
	const pendingAnnouncement = $derived.by(() => {
		if (isEntering) return 'Entering manual mode'
		if (isExiting) return 'Exiting manual mode'
		return ''
	})
	const statusText = $derived(isManualMode ? 'Manual mode' : 'Disabled')

	const enter = () => {
		lastAction = 'enter'
		countdown.start(enableAfter ?? EMPTY_FIELD_SECONDS)
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

<!-- Two rows in a narrow pane. From a 584 px container it is one row: Enter, Exit, the timing sentence, then the status. -->
<div class="@container min-w-0 grow">
	<div class="flex flex-wrap items-center gap-x-2 gap-y-3 @[584px]:flex-nowrap">
		<div class="order-1 flex items-center gap-2">
			<button
				type="button"
				class="button button-dark button-xs"
				disabled={isPending || countdown.isCounting || isManualMode}
				aria-busy={isEntering}
				onclick={enter}
			>
				{#if isEntering}
					<span
						class="progress-dots"
						aria-hidden="true"
					></span>
				{/if}
				{#if countdown.isCounting}
					<span>Enabling in {countdown.secondsRemaining}s</span>
				{:else}
					Enter
				{/if}
			</button>
			<button
				type="button"
				class="button button-dark button-xs"
				disabled={isPending}
				aria-busy={isExiting}
				onclick={exit}
			>
				{#if isExiting}
					<span
						class="progress-dots"
						aria-hidden="true"
					></span>
				{/if}
				Exit
			</button>
		</div>
		<span
			class="sr-only"
			role="status"
		>
			{pendingAnnouncement}
		</span>
		<span
			class={[
				'badge order-2 ml-auto whitespace-nowrap @[584px]:order-3',
				isManualMode && 'badge-success',
			]}
		>
			{statusText}
		</span>
		<div
			role="group"
			aria-label="Manual mode timing"
			class="order-3 flex w-full min-w-0 flex-wrap items-center gap-1.5 text-xs @[584px]:order-2 @[584px]:w-auto @[584px]:flex-nowrap"
		>
			<span>Enable for</span>
			<NumberField
				aria-label="Enable for, seconds"
				suffix="s"
				min={0}
				class="min-w-16 flex-1 @[584px]:w-16 @[584px]:flex-none"
				{...emptyOnClear(() => (enabledFor = undefined))}
				bind:value={enabledFor}
			/>
			<span>after</span>
			<NumberField
				aria-label="Enable after, seconds"
				suffix="s"
				min={0}
				class="min-w-16 flex-1 @[584px]:w-16 @[584px]:flex-none"
				{...emptyOnClear(() => (enableAfter = undefined))}
				bind:value={enableAfter}
			/>
			<Tooltip>
				<Tooltip.Trigger>
					<button
						type="button"
						class="icon-button size-6"
						aria-label="About manual mode timing"
					>
						<Icon
							icon={mdiInformationOutline}
							size="sm"
						/>
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content class="max-w-72 text-xs">
					This arm can be moved by hand in manual mode, which puts it into gravity compensation or
					servo release mode. Enable for is how long manual mode stays on, in seconds, and 0 means
					no time limit. Enable after is the delay before manual mode starts, in seconds.
				</Tooltip.Content>
			</Tooltip>
		</div>
	</div>
</div>
