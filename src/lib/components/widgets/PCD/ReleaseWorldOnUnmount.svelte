<!--
@component
A visualizer plugin: mount it inside `<Visualizer>`. It frees the visualizer's ECS world when the
visualizer unmounts.

koota allows 16 live worlds, and the visualizer creates one per mount and never frees it. Without
this, the 17th point cloud view a page mounts throws.
-->
<script lang="ts">
	import { useWorld } from '@viamrobotics/visualization'

	const world = useWorld()

	$effect(() => () => {
		// Deferred, so the visualizer's own teardowns still find the world they clean up in.
		queueMicrotask(() => {
			world.destroy()
		})
	})
</script>
