<script lang="ts">
	import '../../../../../../app.css'
	import DoCommand from '../../DoCommand.svelte'
</script>

<div
	data-testid="pane"
	class="w-80"
>
	<DoCommand
		partID="test-part"
		resource={{ namespace: 'rdk', type: 'component', subtype: 'arm', name: 'my-arm' }}
	/>
</div>
