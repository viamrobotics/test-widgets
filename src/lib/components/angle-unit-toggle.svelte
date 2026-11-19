<script lang="ts">
	import { mdiSync } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

	interface Props {
		useRadians: boolean
		onToggle: () => void
	}

	const { useRadians, onToggle }: Props = $props()

	const label = $derived(useRadians ? 'Switch to Degrees' : 'Switch to Radians')
</script>

<Tooltip>
	<Tooltip.Trigger>
		<button
			type="button"
			class="icon-button size-6"
			aria-label={label}
			onclick={onToggle}
		>
			<Icon
				icon={mdiSync}
				size="sm"
			/>
		</button>
	</Tooltip.Trigger>
	<Tooltip.Content>{label}</Tooltip.Content>
</Tooltip>
