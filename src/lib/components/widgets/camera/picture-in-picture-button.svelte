<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'

	import { usePip } from '../../../pip/context.svelte'

	interface Props {
		resourceName: string
		rate: number | 'live' | false
	}

	const { resourceName, rate }: Props = $props()

	const pip = usePip()
	const isLoading = $derived(pip.readyState === 'loading')

	$effect(() => {
		if (resourceName === pip.resourceName) {
			pip.setRate(rate)
		}
	})
</script>

<!-- No `progress`: the prime-core spinner collides with the `pill` utility in tailwind-config 1.6 and later. -->
<Button
	icon="picture-in-picture-top-right"
	aria-busy={isLoading}
	onclick={() => pip.toggle(resourceName)}
>
	Picture-in-picture
</Button>
<span
	class="sr-only"
	role="status"
>
	{isLoading ? 'Loading picture-in-picture' : ''}
</span>
