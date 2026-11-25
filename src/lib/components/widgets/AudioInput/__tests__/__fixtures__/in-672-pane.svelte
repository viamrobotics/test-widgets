<script lang="ts">
	import '../../../../../../app.css'

	import type { Component } from 'svelte'

	interface Props {
		widget: Component<{ partID: string; resourceName: string }>
	}

	const { widget: Widget }: Props = $props()
</script>

<div
	data-testid="pane"
	class="w-[42rem]"
>
	<Widget
		partID="test-part"
		resourceName="test-audio-in"
	/>
</div>
