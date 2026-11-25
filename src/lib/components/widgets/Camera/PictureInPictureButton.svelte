<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import { usePip } from '../../../pip/context.svelte'

	interface Props {
		resourceName: string
		rate: number | 'live' | false
	}

	const { resourceName, rate }: Props = $props()

	const pip = usePip()

	$effect(() => {
		if (resourceName === pip.resourceName) {
			pip.setRate(rate)
		}
	})
</script>

<Button
	icon="picture-in-picture-top-right"
	onclick={() => pip.toggle(resourceName)}
	progress={pip.readyState === 'loading' ? 'indeterminate' : undefined}
>
	Picture-in-picture
</Button>
