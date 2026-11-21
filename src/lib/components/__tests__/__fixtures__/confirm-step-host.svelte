<script lang="ts">
	import type { ComponentProps } from 'svelte'

	import ConfirmStep from '../../confirm-step.svelte'

	const props: ComponentProps<typeof ConfirmStep> = $props()
</script>

<button type="button">Outside</button>
<ConfirmStep {...props} />
