<!-- 
  @component
  Adds controls for following a lat, lng point on a map.
-->
<script lang="ts">
	import { Checkbox, Field, Label } from '@viamrobotics/prime-ui'
	import { fromStore } from 'svelte/store'

	import { useMapLibre } from '../hooks.svelte'

	interface Props {
		/** The map point to follow */
		lng?: number
		lat?: number
		following?: boolean
		onChange?: (following: boolean) => void
	}

	let { lng, lat, onChange, following = $bindable(false) }: Props = $props()

	const context = useMapLibre()
	const map = fromStore(context.map)

	let rafID = 0

	const follow = () => {
		if (lng && lat && following) {
			map.current.setCenter([lng, lat])
			rafID = requestAnimationFrame(follow)
		}
	}

	const stop = () => {
		cancelAnimationFrame(rafID)
		following = false
	}

	$effect(() => {
		if (following) {
			requestAnimationFrame(follow)
		}
	})

	$effect(() => {
		map.current.on('wheel', stop)
		map.current.on('mousedown', stop)

		return () => {
			cancelAnimationFrame(rafID)
			map.current.off('wheel', stop)
			map.current.off('mousedown', stop)
		}
	})

	const setFollowing = (checked: boolean) => {
		following = checked
		onChange?.(following)
	}
</script>

<Field
	class="flex items-center gap-2"
	disabled={lng === undefined || lat === undefined}
>
	<Checkbox bind:checked={() => following, setFollowing} />
	<Label>Follow</Label>
</Field>
