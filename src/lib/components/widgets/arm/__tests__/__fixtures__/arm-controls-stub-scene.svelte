<script lang="ts">
	import type { ArmSceneProps } from '../../arm-scene-context'

	const { partID, resourceName, isBuiltin, onError }: ArmSceneProps = $props()
</script>

<div data-testid="stub-scene">
	<output data-testid="stub-scene-props">{partID}|{resourceName}|{isBuiltin}</output>
	<button
		type="button"
		onclick={() => onError(new Error('plan failed'))}
	>
		fail scene
	</button>
</div>
