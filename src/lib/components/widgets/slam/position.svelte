<script lang="ts">
	import { Button, Label } from '@viamrobotics/prime-core';
	import type { SlamPosition } from '@viamrobotics/sdk';

	import { formatNumeric } from '$lib/format';

	interface Props {
		position: SlamPosition;
	}

	const { position }: Props = $props();

	// Position is returned in millimeters, but we display meters
	const pose = $derived(
		position.pose
			? {
					oX: position.pose.oX,
					oY: position.pose.oY,
					oZ: position.pose.oZ,
					theta: position.pose.theta,
					x: position.pose.x / 1000,
					y: position.pose.y / 1000,
					z: position.pose.z / 1000
				}
			: undefined
	);

	const copyToClipboard = async () => {
		await window.navigator.clipboard.writeText(JSON.stringify(pose));
	};
</script>

<div class="flex flex-col gap-4">
	<Label>
		Current position <abbr>(m)</abbr>

		<dl
			slot="input"
			class="flex flex-row items-center gap-2"
		>
			<dt class="text-xs text-gray-500">x</dt>
			<dd>{formatNumeric(pose?.x, 1)}</dd>
			<dt class="text-xs text-gray-500">y</dt>
			<dd>{formatNumeric(pose?.y, 1)}</dd>
			<dt class="text-xs text-gray-500">z</dt>
			<dd>{formatNumeric(pose?.z, 1)}</dd>
		</dl>
	</Label>

	<Label>
		Current orientation

		<dl
			slot="input"
			class="flex flex-row items-center gap-2"
		>
			<dt class="text-xs text-gray-500">x</dt>
			<dd>{formatNumeric(pose?.oX, 1)}</dd>
			<dt class="text-xs text-gray-500">y</dt>
			<dd>{formatNumeric(pose?.oY, 1)}</dd>
			<dt class="text-xs text-gray-500">z</dt>
			<dd>{formatNumeric(pose?.oZ, 1)}</dd>
			<dt class="text-xs text-gray-500">&theta;</dt>
			<dd>{formatNumeric(pose?.theta, 1)}</dd>
		</dl>
	</Label>

	<div>
		<Button
			icon="content-copy"
			onclick={copyToClipboard}
		>
			Copy pose to clipboard
		</Button>
	</div>
</div>
