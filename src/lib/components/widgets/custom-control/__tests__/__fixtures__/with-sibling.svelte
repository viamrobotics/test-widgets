<script lang="ts">
	import type { ComponentProps } from 'svelte'

	import Subject from '../../custom-control.svelte'

	const { ...props }: ComponentProps<typeof Subject> = $props()
</script>

<p data-testid="sibling">Beside the control</p>
<Subject {...props} />
