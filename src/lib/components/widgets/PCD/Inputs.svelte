<script lang="ts">
	import type { Vector3Tuple } from 'three'

	import { Folder, NumberField, Panel, Select } from '@viamrobotics/prime-controls'
	import { untrack } from 'svelte'

	interface Props {
		pointSize: number
		up: Vector3Tuple
		onPointSizeChange: (value: number) => void
		onUpChange: (value: Vector3Tuple) => void
	}

	const { pointSize, up, onPointSizeChange, onUpChange }: Props = $props()

	const upAxisLabelId = $props.id()

	const coordSystems = [
		{ label: '+y', value: '0,1,0' },
		{ label: '-y', value: '0,-1,0' },
		{ label: '+z', value: '0,0,1' },
		{ label: '-z', value: '0,0,-1' },
		{ label: '+x', value: '1,0,0' },
		{ label: '-x', value: '-1,0,0' },
	]

	const parseUp = (value: string): Vector3Tuple | undefined => {
		const [x, y, z, ...rest] = value.split(',').map(Number)
		if (x === undefined || y === undefined || z === undefined || rest.length > 0) return undefined
		return [x, y, z]
	}

	// An emptied field stays empty while the user types, and the scene keeps its last valid size.
	// Zero is not valid: the visualizer reads a zero size as unset and draws its own default.
	let pointSizeField = $state<number | undefined>(untrack(() => pointSize))

	const getPointSize = () => pointSizeField
	const setPointSize = (value: number | undefined) => {
		pointSizeField = value
		if (value !== undefined && Number.isFinite(value) && value > 0) {
			onPointSizeChange(value)
		}
	}

	const getUp = () => up.toString()
	const setUp = (value: string) => {
		const next = parseUp(value)
		if (next) {
			onUpChange(next)
		}
	}
</script>

<!-- Bottom left is the one corner the visualizer draws nothing in. -->
<div class="absolute bottom-2 left-2 z-10 flex max-h-full max-w-full flex-col">
	<Panel
		aria-label="View"
		class="min-h-0 overflow-auto"
	>
		<Folder title="View">
			<NumberField
				label="Point size"
				step={0.01}
				min={0}
				bind:value={getPointSize, setPointSize}
			/>
			<div class="flex items-center gap-2">
				<span
					id={upAxisLabelId}
					class="text-subtle-1 shrink-0 text-xs">Up axis</span
				>
				<Select
					items={coordSystems}
					aria-labelledby={upAxisLabelId}
					bind:value={getUp, setUp}
				/>
			</div>
		</Folder>
	</Panel>
</div>
