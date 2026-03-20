<script lang="ts">
	import { ToggleButtons } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error-display.svelte'

	interface Props {
		numPositions: number
		labels: string[]
		currentPosition: number
		onSelect: (position: number) => void
		lastError: Error | null
	}

	const { numPositions, labels, currentPosition, onSelect, lastError }: Props = $props()

	const hasLabels = $derived(labels.length > 0)
	const options = $derived(
		Array.from({ length: numPositions }, (_, i) => ({
			position: i,
			label: `${labels[i] ?? i}`,
		}))
	)

	const currentOption = $derived(options.find((option) => option.position === currentPosition))

	const handleInput = (event: CustomEvent<string>) => {
		const { detail } = event
		const position = options.find((option) => option.label === detail)?.position
		if (position !== undefined) {
			onSelect(position)
		}
	}
</script>

<div class="flex flex-col gap-2">
	<ToggleButtons
		options={options.map((option) => option.label)}
		selected={currentOption?.label}
		cx={[{ '[&>div>button]:w-12!': !hasLabels }, 'font-roboto-mono [&>div]:flex-wrap!']}
		on:input={handleInput}
	/>
	<ErrorDisplay {lastError} />
</div>
