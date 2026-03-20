<script lang="ts">
	import { Badge } from '@viamrobotics/prime-core';

	import { formatNumeric } from '$lib/format';

	interface Props {
		rtt: number;
	}

	const { rtt }: Props = $props();

	const getBadgeVariant = (currentRtt: number) => {
		if (currentRtt < 50) {
			return 'success';
		}
		if (currentRtt < 500) {
			return 'warning';
		}
		return 'danger';
	};
</script>

<Badge
	label={`${formatNumeric(rtt, 0)} ms`}
	variant={getBadgeVariant(rtt)}
/>
