<script lang="ts">
	import { Select } from '@viamrobotics/prime-controls'

	import { type CameraChoice, DEFAULT_CAMERA_NAME } from './camera-choice.svelte'

	interface Props {
		choice: CameraChoice
	}

	const { choice }: Props = $props()

	// Resource names cannot contain a space, so this value never collides with a camera's name.
	const DEFAULT_CAMERA_ITEM = 'Default camera'

	const items = $derived([
		{ value: DEFAULT_CAMERA_ITEM, label: DEFAULT_CAMERA_ITEM },
		...choice.cameras.map((name) => ({ value: name, label: name })),
	])

	const getValue = () =>
		choice.cameraName === DEFAULT_CAMERA_NAME ? DEFAULT_CAMERA_ITEM : choice.cameraName

	const setValue = (next: string | undefined) => {
		if (next === undefined) return
		choice.pick(next === DEFAULT_CAMERA_ITEM ? DEFAULT_CAMERA_NAME : next)
	}

	const labelId = $props.id()
</script>

<div class="flex max-w-60 min-w-40 flex-1 items-center gap-2">
	<span
		id={labelId}
		class="text-subtle-1 shrink-0 text-xs"
	>
		Camera
	</span>
	<div class="min-w-0 flex-1">
		<Select
			{items}
			bind:value={getValue, setValue}
			aria-labelledby={labelId}
		/>
	</div>
</div>
