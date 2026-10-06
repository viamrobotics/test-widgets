<script lang="ts">
	import { Button, Icon, IconButton } from '@viamrobotics/prime-core'

	import { resolve } from '$app/paths'

	import type { MachineConfigs } from './machine-config'

	import { parseMachineConfigs } from './parse-machine-configs'

	interface Props {
		machines: MachineConfigs
		selectedName: string | undefined
	}

	const { machines, selectedName }: Props = $props()

	const id = $props.id()
	const textID = `machine-config-text-${id}`
	const helpID = `machine-config-help-${id}`
	const errorID = `machine-config-error-${id}`

	let pastedText = $state('')
	let hasError = $state(false)

	const machineQuery = (name: string) => new URLSearchParams({ machine: name }).toString()

	const handleSubmit = (event: SubmitEvent) => {
		event.preventDefault()
		const configs = parseMachineConfigs(pastedText)
		if (!configs) {
			hasError = true
			return
		}
		hasError = false
		machines.add(configs)
		pastedText = ''
	}
</script>

<ul
	aria-label="Machines"
	class="py-3"
>
	{#each machines.current as { name } (name)}
		<li class="hover:bg-ghost-light flex items-center pr-3 sm:pr-5">
			<a
				href={resolve(`/?${machineQuery(name)}`)}
				aria-current={name === selectedName ? 'page' : undefined}
				class="focus:bg-ghost-light active:bg-ghost-medium flex min-w-0 grow items-center gap-1.5 px-3 py-1 text-sm sm:px-5"
			>
				<Icon
					name="check"
					aria-hidden="true"
					cx={['text-gray-6', { 'opacity-0': name !== selectedName }]}
				/>
				<Icon
					name="robot-outline"
					aria-hidden="true"
					cx="text-gray-6"
				/>
				<span class="truncate overflow-auto">
					{name}
				</span>
			</a>
			{#if !machines.isEnvConfig(name)}
				<IconButton
					icon="trash-can-outline"
					label={`Remove ${name}`}
					onclick={() => machines.remove(name)}
				/>
			{/if}
		</li>
	{/each}
</ul>

<details
	open={machines.current.length === 0}
	class="px-3 pb-3 sm:px-5"
>
	<summary class="cursor-pointer py-1 text-sm">Add a machine</summary>
	<form
		class="flex flex-col gap-2 pt-2"
		onsubmit={handleSubmit}
	>
		<label
			for={textID}
			class="text-subtle-1 text-xs"
		>
			Machine config JSON
		</label>
		<textarea
			id={textID}
			bind:value={pastedText}
			rows="6"
			spellcheck="false"
			aria-invalid={hasError}
			aria-describedby={hasError ? `${helpID} ${errorID}` : helpID}
			class={[
				'text-default font-roboto-mono w-full appearance-none border px-2 py-1 text-xs leading-tight outline-none',
				hasError
					? 'border-danger-dark focus:outline-danger-dark focus:outline-[1.5px] focus:-outline-offset-1'
					: 'border-light hover:border-gray-6 focus:border-gray-9 bg-white',
			]}
		></textarea>
		<p
			id={helpID}
			class="text-subtle-2 text-xs"
		>
			Paste one machine config with a name, or a whole VITE_PLAYGROUND_ROBOTS value.
		</p>
		{#if hasError}
			<p
				id={errorID}
				role="alert"
				class="text-danger-dark text-xs"
			>
				That text is not a valid machine config.
			</p>
		{/if}
		<Button type="submit">Add machine</Button>
	</form>
</details>
