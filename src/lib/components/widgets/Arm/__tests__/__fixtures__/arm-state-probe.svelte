<script lang="ts">
	import { untrack } from 'svelte'

	import { useArmState } from '../../arm-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const PROBE_POSITION_STEP_MILLIMETERS = 20

	const { jogSteps } = untrack(() => useArmState(partID, resourceName))
</script>

<p data-testid="shared-joint-step">{jogSteps.jointDegrees}</p>
<button
	type="button"
	onclick={() => {
		jogSteps.positionMillimeters = PROBE_POSITION_STEP_MILLIMETERS
	}}
>
	Set shared position step
</button>
