<!--
  @component
  A user legend for the SLAM map axes, in the colors the map's axes helper draws.
-->
<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'
</script>

<div
	role="group"
	aria-label="Axes legend"
	class="flex flex-wrap items-center gap-x-3 gap-y-1"
>
	<span class="inline-flex items-center gap-1">
		<StatusDot
			state="danger"
			label="Red"
		/>
		<span class="text-subtle-1 text-xs">x axis</span>
	</span>
	<span class="inline-flex items-center gap-1">
		<StatusDot
			state="success"
			label="Green"
		/>
		<span class="text-subtle-1 text-xs">y axis</span>
	</span>
</div>
