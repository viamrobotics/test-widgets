<script lang="ts">
	import { useGamepad } from '@threlte/extras';

	import type { StandardGamepadEvent } from './standard-gamepad-event';

	interface Props {
		onChange: (event: StandardGamepadEvent) => void;
		onConnectionChange: (connected: boolean) => void;
	}

	const { onChange, onConnectionChange }: Props = $props();

	const { on, connected } = useGamepad();

	$effect.pre(() => {
		on('change', onChange);
	});

	$effect.pre(() => {
		onConnectionChange($connected);
	});
</script>
