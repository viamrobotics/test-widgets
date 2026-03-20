<!-- 
  @component
  Adds controls for following a lat, lng point on a map.
-->
<script lang="ts">
	import { Button, Icon } from '@viamrobotics/prime-core';

	import { useMapLibre } from '../hooks';

	interface Props {
		/** The map point to follow */
		lng?: number;
		lat?: number;
		following?: boolean;
		onChange?: (following: boolean) => void;
	}

	let { lng, lat, onChange, following = $bindable(false) }: Props = $props();

	const { map } = useMapLibre();

	let rafID = 0;

	const follow = () => {
		if (lng && lat && following) {
			map.setCenter([lng, lat]);
			rafID = requestAnimationFrame(follow);
		}
	};

	const stop = () => {
		cancelAnimationFrame(rafID);
		following = false;
	};

	$effect(() => {
		if (following) {
			requestAnimationFrame(follow);
		}
	});

	$effect(() => {
		map.on('wheel', stop);
		map.on('mousedown', stop);

		return () => {
			cancelAnimationFrame(rafID);
			map.off('wheel', stop);
			map.off('mousedown', stop);
		};
	});

	const handleClick = (event: MouseEvent) => {
		event.stopPropagation();
		following = !following;
		onChange?.(following);
	};
</script>

<Button
	disabled={lng === undefined || lat === undefined}
	onclick={handleClick}
>
	<Icon name={following ? 'navigation-variant' : 'navigation-variant-outline'} />
</Button>
