<script lang="ts">
	import { pressAndHold, type PressAndHoldOptions } from '../../press-and-hold'

	const { onPress, onRelease }: PressAndHoldOptions = $props()
</script>

<button
	type="button"
	{@attach pressAndHold({ onPress, onRelease })}
>
	Hold
</button>
