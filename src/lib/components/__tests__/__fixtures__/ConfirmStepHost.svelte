<script lang="ts">
	import type { ComponentProps } from 'svelte'

	import ConfirmStep from '../../ConfirmStep.svelte'

	const props: ComponentProps<typeof ConfirmStep> = $props()
</script>

<button type="button">Outside</button>
<ConfirmStep {...props} />
