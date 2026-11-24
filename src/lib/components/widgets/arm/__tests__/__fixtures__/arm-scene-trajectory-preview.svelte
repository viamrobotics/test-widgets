<script lang="ts">
	import type { TrajectoryPreviewProps } from '@viamrobotics/visualization/scoped-scene'

	const { trajectory }: TrajectoryPreviewProps = $props()
</script>

<p data-testid="trajectory-preview">{JSON.stringify(trajectory ?? null)}</p>
