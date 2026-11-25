<script lang="ts">
	import '../../../../../../app.css'

	import type { Component } from 'svelte'

	import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

	interface Props {
		widget: Component<{ partID: string; resourceName: string }>
	}

	const { widget }: Props = $props()
</script>

<div
	data-testid="pane"
	class="w-80"
>
	<InWidgetsProvider
		component={widget}
		props={{ partID: 'test-part', resourceName: 'test-arm' }}
	/>
</div>
