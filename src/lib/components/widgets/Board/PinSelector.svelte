<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { TextField, ToggleButtons } from '@viamrobotics/prime-controls'

	import {
		isPinMode,
		isPinType,
		PIN_MODE_ITEMS,
		PIN_TYPE_ITEMS,
		type PinSelection,
	} from './board.ts'

	interface Props {
		// NOTE(zp,2024-06-25) This was done instead of a bind:value to simplify unit-testing
		value: PinSelection
		onChange: (selection: PinSelection) => void
		class?: ClassValue
	}

	const { value, onChange, class: className }: Props = $props()

	const changePin = (pin: string) => {
		onChange({ ...value, pin })
	}

	const changeType = (type: string) => {
		if (isPinType(type)) onChange({ ...value, type })
	}

	const changeMode = (mode: string) => {
		if (isPinMode(mode)) onChange({ ...value, mode })
	}
</script>

<div class={['flex flex-col gap-1', className]}>
	<TextField
		class="max-w-40"
		label="Pin"
		placeholder="11"
		bind:value={() => value.pin, changePin}
	/>
	<ToggleButtons
		label="Pin type"
		items={PIN_TYPE_ITEMS}
		bind:value={() => value.type, changeType}
	/>
	<ToggleButtons
		label="Mode"
		items={PIN_MODE_ITEMS}
		bind:value={() => value.mode, changeMode}
	/>
</div>
