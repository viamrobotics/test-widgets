<script lang="ts">
	import type { ArmSceneProps } from '$lib/components/widgets/arm/arm-scene-context'

	// Stands in for the host's 3D scene, so ArmControls shows its "Open 3D scene" button when measured.
	const { resourceName }: ArmSceneProps = $props()
</script>

<div data-scene-for={resourceName}></div>
