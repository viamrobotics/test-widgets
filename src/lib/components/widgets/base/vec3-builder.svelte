<!-- 
NOTE(zp,2024-06-11) This is specifically designed for BaseView

I'd be wary of using this elsewhere unless the use case & styling is identitcal
-->
<script lang="ts">
	import { Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core';
	import type { Vector3 } from '@viamrobotics/sdk';

	import { numberValueFromEvent } from '$lib/event-handlers';

	interface Props {
		title: string;
		titleUnits?: string | undefined;
		titleTooltip?: string | undefined;
		vector: Vector3;
		xTooltip?: string | undefined;
		yTooltip?: string | undefined;
		zTooltip?: string | undefined;
	}

	let {
		title,
		titleUnits,
		titleTooltip,
		vector = $bindable(),
		xTooltip,
		yTooltip,
		zTooltip
	}: Props = $props();

	const builderID = $props.id();
</script>

<section
	class="border-light text-subtle-1 divide-y border text-xs"
	aria-labelledby={builderID}
>
	<h4
		class="bg-light flex flex-row place-content-center gap-1 px-2 py-1.5"
		id={builderID}
	>
		{title}
		{#if titleUnits}
			<abbr class="text-disabled">{titleUnits}</abbr>
		{/if}
		{#if titleTooltip}
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<p
					slot="description"
					class="text-xs whitespace-pre-line"
				>
					{titleTooltip}
				</p>
			</Tooltip>
		{/if}
	</h4>
	<div class="grid max-w-46 grid-cols-3 gap-2 px-3 py-2.5">
		<Label cx="flex flex-col gap-1">
			<span class="flex gap-1">
				X
				{#if xTooltip}
					<Tooltip>
						<Icon
							name="information-outline"
							cx="text-gray-6"
						/>

						<p slot="description">
							{xTooltip}
						</p>
					</Tooltip>
				{/if}
			</span>

			<NumericInput
				slot="input"
				cx="text-default"
				value={vector.x}
				on:change={(event) => {
					vector.x = numberValueFromEvent(event) ?? 0;
				}}
			/>
		</Label>
		<Label cx="flex flex-col gap-1">
			<span class="flex gap-1">
				Y
				{#if yTooltip}
					<Tooltip>
						<Icon
							name="information-outline"
							cx="text-gray-6"
						/>

						<p slot="description">
							{yTooltip}
						</p>
					</Tooltip>
				{/if}
			</span>

			<NumericInput
				slot="input"
				cx="text-default"
				value={vector.y}
				on:change={(event) => {
					vector.y = numberValueFromEvent(event) ?? 0;
				}}
			/>
		</Label>
		<Label cx="flex flex-col gap-1">
			<span class="flex gap-1">
				Z
				{#if zTooltip}
					<Tooltip>
						<Icon
							name="information-outline"
							cx="text-gray-6"
						/>

						<p slot="description">
							{zTooltip}
						</p>
					</Tooltip>
				{/if}
			</span>

			<NumericInput
				slot="input"
				cx="text-default"
				value={vector.z}
				on:change={(event) => {
					vector.z = numberValueFromEvent(event) ?? 0;
				}}
			/>
		</Label>
	</div>
</section>
