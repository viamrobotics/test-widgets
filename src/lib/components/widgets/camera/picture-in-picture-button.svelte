<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'

	import { usePip } from '../../../pip/context.svelte'

	interface Props {
		resourceName: string
		rate: number | 'live' | false
	}

	const { resourceName, rate }: Props = $props()

	const pip = usePip()

	let lastErr = $state.raw<Error>()

	const togglePictureInPicture = async () => {
		lastErr = undefined
		try {
			await pip.toggle(resourceName)
		} catch (error) {
			lastErr = error as Error
		}
	}

	$effect(() => {
		pip.setRate(rate)
	})
</script>

<Button
	icon="picture-in-picture-top-right"
	onclick={togglePictureInPicture}
	progress={pip.readyState === 'loading' ? 'indeterminate' : undefined}
>
	Toggle picture-in-picture
</Button>

<ErrorDisplay
	class="max-w-50"
	lastError={lastErr}
/>
