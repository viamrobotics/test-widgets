<!--
This is a simple wrapper over <Button> to provide a simple confirmation state
Right now, it is board-only
-->
<script lang="ts">
	import { Button, Icon } from '@viamrobotics/prime-core'

	interface Props {
		onclick: (event: MouseEvent) => void
		children?: import('svelte').Snippet
		[key: string]: unknown
	}

	const { onclick, children, ...rest }: Props = $props()

	let readyState: 'ready' | 'clicked' = $state('ready')

	let stateTimeout: number

	const handleClick = (event: MouseEvent) => {
		onclick(event)
		clearTimeout(stateTimeout)
		readyState = 'clicked'
		stateTimeout = globalThis.setTimeout(() => {
			readyState = 'ready'
		}, 1000)
	}
</script>

<Button
	{...rest}
	onclick={handleClick}
>
	{#if readyState === 'ready'}
		{@render children?.()}
	{:else}
		<Icon
			name="check"
			cx="text-gray-6"
		/>
	{/if}
</Button>
