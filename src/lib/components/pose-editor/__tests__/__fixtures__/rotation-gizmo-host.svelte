<script lang="ts">
	import type { OrientationVector } from '$lib/orientation-vector-quaternion'

	import RotationGizmo from '../../rotation-gizmo.svelte'

	interface Props {
		orientation: OrientationVector
		onChange: (orientation: OrientationVector) => void
	}

	const { orientation, onChange }: Props = $props()
</script>

<RotationGizmo
	bind:orientation={() => orientation, onChange}
	id="rotation-gizmo"
/>
