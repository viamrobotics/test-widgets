<script lang="ts">
	interface Props {
		samples: readonly number[]
		/** The line's slot count. Fewer samples draw from the left. */
		capacity: number
	}

	const { samples, capacity }: Props = $props()

	const WIDTH = 100
	const HEIGHT = 20
	const PADDING = 1

	const points = $derived.by(() => {
		const slots = Math.max(capacity - 1, 1)
		const low = Math.min(...samples)
		const range = Math.max(...samples) - low
		const innerHeight = HEIGHT - PADDING * 2

		const toY = (sample: number) => {
			if (range === 0) return HEIGHT / 2
			return PADDING + innerHeight * (1 - (sample - low) / range)
		}

		return samples.map((sample, index) => `${(index * WIDTH) / slots},${toY(sample)}`).join(' ')
	})
</script>

<svg
	aria-hidden="true"
	viewBox="0 0 {WIDTH} {HEIGHT}"
	preserveAspectRatio="none"
	class="text-info-dark block h-5 w-full min-w-0"
>
	<polyline
		data-testid="history-line-polyline"
		{points}
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linejoin="round"
		vector-effect="non-scaling-stroke"
	/>
</svg>
