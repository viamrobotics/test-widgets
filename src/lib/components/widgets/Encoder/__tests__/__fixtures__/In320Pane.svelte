<script lang="ts">
	import '../../../../../../app.css'

	import type { Component } from 'svelte'

	import WidgetsProvider from '#lib/WidgetsProvider.svelte'

	interface Props {
		widget: Component<{ partID: string; resourceName: string }>
	}

	const { widget: Widget }: Props = $props()
</script>

<WidgetsProvider>
	<div
		data-testid="pane"
		class="w-80"
	>
		<Widget
			partID="test-part"
			resourceName="test-encoder"
		/>
	</div>
</WidgetsProvider>
