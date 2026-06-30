<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'

	import { usePip } from '../../../pip/context.svelte'

	interface Props {
		resourceName: string
	}

	const { resourceName }: Props = $props()

	const pip = usePip()
</script>

<Button
	icon="picture-in-picture-top-right"
	onclick={() => pip.toggle(resourceName)}
	progress={pip.readyState === 'loading' ? 'indeterminate' : undefined}
>
	Toggle picture-in-picture
</Button>

<ErrorDisplay
	class="max-w-50"
	lastError={pip.error}
/>
