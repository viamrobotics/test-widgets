<script lang="ts">
	import type { ScopedSceneProps } from '@viamrobotics/visualization/scoped-scene'

	const { partID, frame, onError, children }: ScopedSceneProps = $props()
</script>

<div
	data-testid="scoped-scene"
	data-part-id={partID}
	data-frame={frame}
>
	<button
		type="button"
		onclick={() => onError?.('The scene could not load the frame system.')}
	>
		Fail scene
	</button>
	{@render children?.()}
</div>
