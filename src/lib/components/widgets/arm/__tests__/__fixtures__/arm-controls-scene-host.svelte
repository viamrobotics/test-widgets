<script lang="ts">
	import '../../../../../../app.css'

	import { untrack } from 'svelte'

	import { type PopOutHost, providePopOutHost } from '$lib/components/pop-out/pop-out-host-context'

	import Subject from '../../arm-controls.svelte'
	import { provideArmScene } from '../../arm-scene-context'
	import StubScene from './arm-controls-stub-scene.svelte'

	interface Props {
		/** The pane width in px. */
		width: number
		/** Whether to supply the stub scene. */
		hasScene?: boolean
		host?: PopOutHost
	}

	const { width, hasScene = true, host }: Props = $props()

	untrack(() => {
		if (hasScene) provideArmScene(StubScene)
		if (host) providePopOutHost(host)
	})
</script>

<div
	data-testid="pane"
	style:width="{width}px"
>
	<Subject
		partID="test-part"
		resourceName="arm-1"
	/>
</div>
