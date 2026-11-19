<script lang="ts">
	import '../../../../../../app.css'

	import type { ComponentProps } from 'svelte'

	import Subject from '../../custom-control.svelte'

	const { ...props }: ComponentProps<typeof Subject> = $props()
</script>

<div
	data-testid="pane"
	class="w-80"
>
	<Subject {...props} />
</div>
