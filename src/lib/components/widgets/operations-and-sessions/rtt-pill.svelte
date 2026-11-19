<script lang="ts">
	import { formatNumeric } from '$lib/format'

	interface Props {
		rtt: number
	}

	const { rtt }: Props = $props()

	/** Round trips under this many ms read as healthy. */
	const SUCCESS_BELOW_MS = 50
	/** Round trips under this many ms read as slow, and from here as failing. */
	const WARNING_BELOW_MS = 500

	const getBadgeClass = (currentRtt: number) => {
		if (currentRtt < SUCCESS_BELOW_MS) {
			return 'badge-success'
		}
		if (currentRtt < WARNING_BELOW_MS) {
			return 'badge-warning'
		}
		return 'badge-danger'
	}
</script>

<span class={['badge', getBadgeClass(rtt)]}>RTT {formatNumeric(rtt, 0)} ms</span>
