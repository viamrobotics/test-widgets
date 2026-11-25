<script lang="ts">
	import '../../../../../../app.css'

	import type { Component } from 'svelte'

	import WidgetsProvider from '$lib/widgets-provider.svelte'

	interface Props {
		widget: Component<{ partID: string; resourceName: string }>
		resourceName?: string
	}

	const { widget: Widget, resourceName = 'test-input-controller' }: Props = $props()
</script>

<WidgetsProvider>
	<div
		data-testid="pane"
		class="w-80"
	>
		<Widget
			partID="test-part"
			{resourceName}
		/>
	</div>
</WidgetsProvider>
