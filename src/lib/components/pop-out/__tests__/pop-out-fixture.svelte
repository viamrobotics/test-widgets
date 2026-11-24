<script lang="ts">
	import { untrack } from 'svelte'

	import { type PopOutHost, providePopOutHost } from '../pop-out-host-context'
	import PopOut from '../pop-out.svelte'

	interface Props {
		/** The host to provide. Without one, the fixture renders the Takeover fallback. */
		host?: PopOutHost
		/** The initial value of the bound `open`. */
		open?: boolean
	}

	let { host, open = $bindable(false) }: Props = $props()

	untrack(() => {
		if (host) providePopOutHost(host)
	})
</script>

<button onclick={() => (open = !open)}>toggle</button>
<output data-testid="open">{open}</output>

<PopOut
	title="arm-1 Scene"
	minSize={{ minWidth: 480, minHeight: 320 }}
	bind:open
>
	{#snippet content()}
		<p>scene body</p>
	{/snippet}
</PopOut>
