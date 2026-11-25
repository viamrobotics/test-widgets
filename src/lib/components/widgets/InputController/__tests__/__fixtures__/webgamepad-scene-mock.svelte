<script lang="ts">
	import type { StandardGamepadEvent } from '../../standard-gamepad-event'

	import { sceneHandlers } from './scene-handlers'

	interface Props {
		onChange: (event: StandardGamepadEvent) => void
		onConnectionChange: (connected: boolean) => void
	}

	const { onChange, onConnectionChange }: Props = $props()

	$effect.pre(() => {
		sceneHandlers.onChange = onChange
		sceneHandlers.onConnectionChange = onConnectionChange
	})
</script>
