<script lang="ts">
	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	import { errorKey } from './error-key'

	interface Props {
		errors: Error[]
	}

	const { errors }: Props = $props()

	const COPIED_MS = 750

	const count = $derived(errors.length)
	const hasErrors = $derived(count > 0)
	const summary = $derived(hasErrors ? `${count} ${count === 1 ? 'error' : 'errors'}` : 'No errors')
	const text = $derived(errors.map((error) => `${error.name}: ${error.message}`).join('\n'))

	let copied = $state(false)
	let copiedTimer: ReturnType<typeof setTimeout> | undefined

	const label = $derived.by(() => {
		if (copied) return `Copied ${summary}`
		return hasErrors ? `${summary}, copy to clipboard` : summary
	})

	const iconName = $derived.by(() => {
		if (copied) return 'check'
		return hasErrors ? 'alert-circle' : 'alert-circle-outline'
	})

	// The cue replays only when the held set changes to a non-empty one, so a steady failing poll
	// fires once and each new distinct error or failed attempt fires again.
	let lastKeys = ''
	let arrivals = 0
	const arrival = $derived.by(() => {
		const keys = errors.map((error) => errorKey(error)).join('\0\0')
		if (keys !== lastKeys) {
			lastKeys = keys
			if (keys !== '') arrivals += 1
		}

		return arrivals
	})

	const copy = async () => {
		if (!hasErrors) return
		try {
			await globalThis.navigator.clipboard.writeText(text)
			copied = true
			clearTimeout(copiedTimer)
			copiedTimer = setTimeout(() => {
				copied = false
			}, COPIED_MS)
		} catch (error) {
			console.error('Failed to copy errors to clipboard', error)
		}
	}

	$effect(() => () => clearTimeout(copiedTimer))
</script>

<Tooltip let:tooltipID>
	<button
		type="button"
		aria-label={label}
		aria-describedby={tooltipID}
		onclick={copy}
		class={[
			// The pseudo-element pads the hit area to 24px (WCAG 2.5.8) without growing the heading row.
			'relative inline-flex items-center gap-0.5 p-0.5 after:absolute after:-inset-0.5',
			{
				'text-gray-6': !hasErrors && !copied,
				'text-danger-dark hover:bg-medium': hasErrors && !copied,
				'text-success-dark': copied,
			},
		]}
	>
		{#key arrival}
			<span class={['inline-flex rounded-full', arrival > 0 && 'arrival']}>
				<Icon name={iconName} />
			</span>
		{/key}
		{#if hasErrors}
			<span class="font-roboto-mono text-xs leading-none">{count}</span>
		{/if}
	</button>
	<div
		slot="description"
		class="flex flex-col gap-1"
	>
		<div class="text-gray-5 flex justify-between gap-3">
			<span>{summary}</span>
			{#if hasErrors}
				<span>{copied ? 'Copied' : 'Click to copy'}</span>
			{/if}
		</div>
		{#each errors as error (errorKey(error))}
			<p class="font-roboto-mono">{error.name}: {error.message}</p>
		{/each}
	</div>
</Tooltip>

<style>
	@keyframes arrival {
		0% {
			transform: scale(1) rotate(0deg);
			background-color: transparent;
		}
		15% {
			transform: scale(1.35) rotate(-14deg);
			background-color: color-mix(in srgb, var(--color-danger-light) 50%, transparent);
		}
		30% {
			transform: scale(1.35) rotate(14deg);
			background-color: color-mix(in srgb, var(--color-danger-light) 50%, transparent);
		}
		45% {
			transform: scale(1.35) rotate(-14deg);
			background-color: color-mix(in srgb, var(--color-danger-light) 50%, transparent);
		}
		60% {
			transform: scale(1.35) rotate(14deg);
			background-color: color-mix(in srgb, var(--color-danger-light) 50%, transparent);
		}
		80% {
			transform: scale(1.35) rotate(0deg);
			background-color: color-mix(in srgb, var(--color-danger-light) 50%, transparent);
		}
		100% {
			transform: scale(1) rotate(0deg);
			background-color: transparent;
		}
	}

	.arrival {
		animation: arrival 600ms cubic-bezier(0.165, 0.84, 0.44, 1) 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.arrival {
			animation: none;
		}
	}
</style>
