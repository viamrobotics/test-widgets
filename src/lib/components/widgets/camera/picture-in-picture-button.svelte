<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'

	import { usePipContext } from './pip-context.svelte'

	interface Props {
		resourceName: string
	}

	const { resourceName }: Props = $props()

	const pip = usePipContext()

	let lastErr = $state.raw<Error>()

	const togglePictureInPicture = async () => {
		lastErr = undefined
		try {
			await pip.togglePip(resourceName)
		} catch (error) {
			lastErr = error as Error
		}
	}
</script>

<Button
	icon="picture-in-picture-top-right"
	onclick={togglePictureInPicture}
>
	Toggle picture-in-picture
</Button>

<ErrorDisplay
	class="max-w-50"
	lastError={lastErr}
/>
