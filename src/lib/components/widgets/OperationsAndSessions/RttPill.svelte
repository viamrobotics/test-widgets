<script lang="ts">
	import { formatNumeric } from '#lib/format.js'

	interface Props {
		rtt: number | undefined
	}

	const { rtt }: Props = $props()

	/** Round trips under this many ms read as healthy. */
	const SUCCESS_BELOW_MS = 50
	/** Round trips under this many ms read as slow, and from here as failing. */
	const WARNING_BELOW_MS = 500

	const getLevel = (currentRtt: number | undefined) => {
		if (currentRtt === undefined) {
			return { badgeClass: 'badge-neutral', word: '' }
		}
		if (currentRtt < SUCCESS_BELOW_MS) {
			return { badgeClass: 'badge-success', word: 'healthy' }
		}
		if (currentRtt < WARNING_BELOW_MS) {
			return { badgeClass: 'badge-warning', word: 'slow' }
		}
		return { badgeClass: 'badge-danger', word: 'failing' }
	}

	const getLabel = (currentRtt: number | undefined, word: string) =>
		currentRtt === undefined ? 'RTT -' : `RTT ${formatNumeric(currentRtt, 0)} ms, ${word}`

	const level = $derived(getLevel(rtt))
</script>

<!-- The word carries the level for anyone who cannot tell the badge colors apart. -->
<span class={['badge', level.badgeClass]}>{getLabel(rtt, level.word)}</span>
