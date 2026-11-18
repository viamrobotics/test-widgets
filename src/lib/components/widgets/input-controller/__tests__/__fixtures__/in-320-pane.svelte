<script lang="ts">
	import '../../../../../../app.css'

	import type { Component } from 'svelte'

	interface Props {
		widget: Component<{ partID: string; resourceName: string }>
		resourceName?: string
	}

	const { widget: Widget, resourceName = 'test-input-controller' }: Props = $props()
</script>

<div
	data-testid="pane"
	class="w-80"
>
	<Widget
		partID="test-part"
		{resourceName}
	/>
</div>
