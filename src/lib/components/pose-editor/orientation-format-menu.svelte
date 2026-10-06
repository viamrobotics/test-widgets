<script lang="ts">
	import { ContextMenuSeparator, FloatingMenu, Icon } from '@viamrobotics/prime-core'
	import { tick } from 'svelte'

	import {
		type AngleUnit,
		FORMAT_LABELS,
		FORMATS,
		type OrientationFormat,
		UNIT_LABELS,
		UNITS,
	} from './orientation-format'

	interface Props {
		format: OrientationFormat
		unit: AngleUnit
		labelId: string
	}

	let { format = $bindable(), unit = $bindable(), labelId }: Props = $props()

	interface MenuOption {
		label: string
		isChecked: boolean
		select: () => void
	}

	interface MenuGroup {
		name: string
		options: MenuOption[]
	}

	let isOpen = $state(false)
	let controlElement = $state<HTMLSpanElement>()
	let itemElements = $state<(HTMLButtonElement | undefined)[]>([])

	const groups = $derived<MenuGroup[]>([
		{
			name: 'Format',
			options: FORMATS.map((option) => ({
				label: FORMAT_LABELS[option],
				isChecked: option === format,
				select: () => (format = option),
			})),
		},
		{
			name: 'Angle unit',
			options: UNITS.map((option) => ({
				label: UNIT_LABELS[option],
				isChecked: option === unit,
				select: () => (unit = option),
			})),
		},
	])

	const optionCount = $derived(groups.reduce((total, group) => total + group.options.length, 0))

	const focusMenuButton = () => {
		controlElement?.closest('button')?.focus()
	}

	const focusItem = (index: number) => {
		itemElements[(index + optionCount) % optionCount]?.focus()
	}

	$effect(() => {
		if (!isOpen) {
			return
		}
		void tick().then(() => {
			focusItem(format === 'vector' ? 0 : 1)
		})
	})

	const close = () => {
		isOpen = false
	}

	const choose = (option: MenuOption) => {
		option.select()
		close()
		focusMenuButton()
	}

	const onItemKeydown = (event: KeyboardEvent, index: number) => {
		switch (event.key) {
			case 'ArrowDown': {
				event.preventDefault()
				focusItem(index + 1)
				break
			}
			case 'ArrowUp': {
				event.preventDefault()
				focusItem(index - 1)
				break
			}
			case 'Home': {
				event.preventDefault()
				focusItem(0)
				break
			}
			case 'End': {
				event.preventDefault()
				focusItem(optionCount - 1)
				break
			}
			case 'Escape': {
				event.preventDefault()
				close()
				focusMenuButton()
				break
			}
			case 'Tab': {
				focusMenuButton()
				close()
				break
			}
			default:
		}
	}

	const flatIndex = (groupIndex: number, optionIndex: number) =>
		groups.slice(0, groupIndex).reduce((total, group) => total + group.options.length, 0) +
		optionIndex
</script>

<FloatingMenu
	{isOpen}
	onChange={(nextIsOpen) => {
		isOpen = nextIsOpen
	}}
	placement="bottom-start"
	buttonCX="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:bg-ghost-light active:bg-ghost-medium focus-visible:ring-gray-9 focus-visible:ring-2 focus-visible:outline-none"
	menuCX="min-w-32"
>
	<span
		slot="control"
		class="inline-flex items-center gap-1"
		bind:this={controlElement}
	>
		<span
			id={labelId}
			class="text-heading text-xs font-semibold">Orientation</span
		>
		<span class="text-subtle-1 text-xs">
			· {FORMAT_LABELS[format]} · {unit}
		</span>
		<Icon
			name="chevron-down"
			size="xs"
		/>
	</span>

	<svelte:fragment slot="items">
		{#each groups as group, groupIndex (group.name)}
			{#if groupIndex > 0}
				<ContextMenuSeparator />
			{/if}
			<div
				role="group"
				aria-label={group.name}
			>
				{#each group.options as option, optionIndex (option.label)}
					<button
						bind:this={itemElements[flatIndex(groupIndex, optionIndex)]}
						type="button"
						role="menuitemradio"
						aria-checked={option.isChecked}
						class="hover:bg-light focus-visible:ring-gray-9 flex w-full items-center gap-1.5 px-3 py-1.5 text-left focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
						onclick={() => {
							choose(option)
						}}
						onkeydown={(event) => {
							onItemKeydown(event, flatIndex(groupIndex, optionIndex))
						}}
					>
						<span
							class="inline-flex w-4 justify-center text-gray-400"
							aria-hidden="true"
						>
							{#if option.isChecked}
								<Icon name="check" />
							{/if}
						</span>
						<span class="text-default text-sm">{option.label}</span>
					</button>
				{/each}
			</div>
		{/each}
	</svelte:fragment>
</FloatingMenu>
