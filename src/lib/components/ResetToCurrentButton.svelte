<!--
@component
The reset button inside an editable field's frame. It puts the field back on the live value. It
keeps its box while the field is unedited and only hides, so the field never changes width.

```svelte
<NumberField label="X" bind:value>
	{#snippet trailing()}
		<ResetToCurrentButton label="X" current="64.01 mm" {isEdited} onreset={reset} />
	{/snippet}
</NumberField>
```
-->
<script lang="ts">
	import { mdiBackupRestore } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

	interface Props {
		/** The field's name, for the accessible name "Reset <label> to <current>". */
		label: string
		/** The live value as the user reads it, unit included. */
		current: string
		/** Whether the field holds an edit. Unedited, the button is hidden and out of the tab order. */
		isEdited: boolean
		onreset: () => void
	}

	const { label, current, isEdited, onreset }: Props = $props()
</script>

<Tooltip>
	<Tooltip.Trigger class="flex shrink-0">
		<!-- A bare icon the width of the glyph. The pseudo-element grows the target to the frame's height only, so it never covers the input or the stepper beside it. -->
		<button
			type="button"
			class="text-subtle-2 hover:text-default focus-ring relative flex size-3.5 items-center justify-center rounded-xs transition-colors after:absolute after:inset-x-0 after:-inset-y-1 motion-reduce:transition-none"
			style:visibility={isEdited ? undefined : 'hidden'}
			aria-label="Reset {label} to {current}"
			onclick={onreset}
		>
			<Icon
				icon={mdiBackupRestore}
				size="sm"
			/>
		</button>
	</Tooltip.Trigger>
	<Tooltip.Content>Reset to {current}</Tooltip.Content>
</Tooltip>
