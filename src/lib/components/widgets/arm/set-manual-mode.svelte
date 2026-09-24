<script lang="ts">
	import { Hand, RobotArm } from '@lucide/svelte'
	import { Button, Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import { numberValueFromEvent } from '$lib/event-handlers'

	import { useCountdown } from './use-countdown.svelte'

	interface Props {
		isManualMode: boolean
		isPending: boolean
		setManualMode: (manualMode: boolean, enabledFor: number) => void
	}

	const { isManualMode, isPending, setManualMode }: Props = $props()

	let enabledFor = $state(90)
	let enableAfter = $state(5)
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

<div class="flex min-w-0 flex-col gap-4 @2xl:flex-row">
	<div class="flex items-center gap-2">
		<Button
			class="w-20 p-3 py-3"
			disabled={isPending || countdown.isCounting}
			progress={isEntering ? 'indeterminate' : undefined}
			onclick={enter}
		>
			<div class="flex flex-col items-center gap-2">
				<Hand class="text-subtle-2 size-4" />
				<p class="font-roboto-mono text-xs uppercase">enter</p>
			</div>
		</Button>
		<Button
			class="w-20 p-3 py-3"
			disabled={isPending}
			progress={isExiting ? 'indeterminate' : undefined}
			onclick={exit}
		>
			<div class="flex flex-col items-center gap-2">
				<RobotArm class="text-subtle-2 size-4" />
				<p class="font-roboto-mono text-xs uppercase">exit</p>
			</div>
		</Button>
		{#if countdown.isCounting}
			<span class="text-subtle-2 text-xs">Enabling in {countdown.secondsRemaining}s</span>
		{/if}
	</div>

	<Label cx="max-w-fit">
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
	<Label cx="max-w-fit">
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
</div>
