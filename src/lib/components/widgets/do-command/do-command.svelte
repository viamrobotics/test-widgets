<script lang="ts" module>
	export interface FavoriteDoCommand {
		id: string
		name: string
		input: string
		createdOn?: Date
	}
</script>

<script lang="ts">
	import {
		Button,
		ContextMenuItem,
		FloatingMenu,
		Icon,
		Progress,
		useToast,
	} from '@viamrobotics/prime-core'
	import { CodeEditor } from '@viamrobotics/prime-core/code-editor'
	import { type ResourceName, Struct } from '@viamrobotics/sdk'
	import { createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { PersistedState } from 'runed'

	import { supportsDoCommand } from '$lib/client-map'
	import { getResourceAPI, getResourceKey } from '$lib/resource-utils'

	import ErrorDisplay from '../../error.svelte'
	import { createDoCommandClient } from './create-do-command-client.svelte'
	import KebabSvg from './kebab-svg.svelte'
	import StarSvg from './star-svg.svelte'

	interface Props {
		partID: string
		resource: ResourceName
		favorites?: FavoriteDoCommand[]
		/** Called with a widget-generated default `name` (`Favorite N`). */
		onAddFavorite?: (name: string, input: string) => void | Promise<void>
		onRemoveFavorite?: (id: string) => void | Promise<void>
		onRenameFavorite?: (id: string, name: string) => void | Promise<void>
	}

	const {
		partID,
		resource,
		favorites,
		onAddFavorite,
		onRemoveFavorite,
		onRenameFavorite,
	}: Props = $props()

	const client = createDoCommandClient(
		() => resource,
		() => partID,
		() => resource.name
	)

	const doCommandMutation = createResourceMutation(client, 'doCommand')

	const isSupported = $derived(supportsDoCommand(resource))

	let lastErr = $state<Error | null>()

	const uid = $props.id()

	const input = $derived(new PersistedState(`${partID}/${getResourceKey(resource)}`, '{\n}'))

	let output = $state('')

	const execute = async () => {
		try {
			lastErr = null
			output = ''
			const parsedInput = Struct.fromJsonString(input.current ?? '{}')
			const data = await doCommandMutation.mutateAsync([parsedInput])
			output = JSON.stringify(data, null, 2)
			lastErr = null
		} catch (error) {
			lastErr = error as Error
		}
	}

	/** Normalize JSON so trivial whitespace differences don't break matching. */
	const normalizeJson = (value: string): string => {
		try {
			return JSON.stringify(JSON.parse(value))
		} catch {
			return value
		}
	}

	const matchingFavorite = $derived(
		(favorites ?? []).find(
			(favorite) => normalizeJson(favorite.input) === normalizeJson(input.current ?? '{}')
		)
	)

	const timeFormatter = new Intl.DateTimeFormat(undefined, {
		month: 'numeric',
		day: '2-digit',
		year: '2-digit',
		hour: 'numeric',
		minute: 'numeric',
	})
	const formatTime = (date: Date | string | undefined): string => {
		if (!date) return ''
		const d = date instanceof Date ? date : new Date(date)
		return Number.isNaN(d.getTime()) ? '' : timeFormatter.format(d)
	}

	const toast = useToast()

	const addFavorite = async () => {
		if (matchingFavorite) {
			toast({ variant: 'info', message: 'Command is already a favorite' })
			return
		}
		if (onAddFavorite) {
			const name = `Favorite ${(favorites ?? []).length + 1}`
			await onAddFavorite(name, input.current ?? '{}')
		}
	}

	let openMenuID = $state<string | null>(null)
	let renamingId = $state<string | null>(null)
	let renameValue = $state('')

	const focusOnMount = (node: HTMLInputElement) => {
		node.focus()
		node.select()
	}

	const startRename = (favorite: FavoriteDoCommand) => {
		openMenuID = null
		renamingId = favorite.id
		renameValue = favorite.name
	}

	const cancelRename = () => {
		renamingId = null
		renameValue = ''
	}

	const submitRename = async (favorite: FavoriteDoCommand) => {
		const trimmed = renameValue.trim()
		if (!trimmed || trimmed === favorite.name) {
			cancelRename()
			return
		}
		if (onRenameFavorite) {
			await onRenameFavorite(favorite.id, trimmed)
		}
		cancelRename()
	}

	const removeFromMenu = async (favorite: FavoriteDoCommand) => {
		openMenuID = null
		if (onRemoveFavorite) {
			await onRemoveFavorite(favorite.id)
		}
	}

	const selectFavorite = (favorite: FavoriteDoCommand) => {
		input.current = favorite.input
	}
</script>

{#if isSupported}
	<div class="flex flex-row items-center justify-between">
		<div class="flex w-[45%] flex-col gap-2 border-r py-2">
			<span class="text-gray-9 px-4 text-sm font-medium">Input</span>
			<CodeEditor
				label="input"
				language="json"
				value={input.current ?? '{}'}
				onChange={(nextInput: string) => {
					input.current = nextInput
				}}
				class="h-56 overflow-y-auto"
				errorMessageID={lastErr ? uid : undefined}
			/>
		</div>

		<div class="m-auto flex flex-col items-center gap-2">
			<Button onclick={execute}>Execute</Button>
			{#if favorites}
				<Button onclick={addFavorite}>
					<span class="flex items-center gap-1.5">
						<StarSvg filled={!!matchingFavorite} />
						Favorite
					</span>
				</Button>
			{/if}
		</div>

		<div class="flex w-[45%] flex-col gap-2 border-l py-2">
			<div class="flex flex-row items-center">
				<span class="text-gray-9 px-4 text-sm font-medium">Output</span>
				{#if doCommandMutation.isPending}
					<Progress
						size="medium"
						variant="dark"
					/>
				{/if}
			</div>
			{#if !lastErr}
				<CodeEditor
					label="output"
					language="json"
					value={output}
					readonly
					class="h-56 overflow-y-auto"
				/>
			{:else}
				<ErrorDisplay
					id={uid}
					class="h-56 px-4"
					lastError={lastErr}
				/>
			{/if}
		</div>
	</div>

	{#if favorites}
		<div class="flex flex-col gap-2 border-t px-4 py-3">
			<h3 class="text-gray-9 text-sm font-medium">Favorite Commands</h3>
			{#if (favorites ?? []).length === 0}
				<p class="text-subtle-1 text-xs">
					Click "Add favorite" to save the current input.
				</p>
			{:else}
				<div class="flex flex-col gap-1">
					{#each favorites ?? [] as favorite (favorite.id)}
						{#if renamingId === favorite.id}
							<div
								class="border-medium bg-light flex w-full items-center gap-1 rounded border pl-2"
							>
								<input
									class="flex-1 bg-transparent text-sm outline-none"
									aria-label="Favorite name"
									bind:value={renameValue}
									{@attach focusOnMount}
									onkeydown={(event) => {
										if (event.key === 'Enter') {
											submitRename(favorite)
										} else if (event.key === 'Escape') {
											cancelRename()
										}
									}}
								/>
								<button
									type="button"
									class="text-subtle-2 hover:text-gray-9 p-1"
									aria-label="Save name"
									onclick={() => submitRename(favorite)}
								>
									<Icon
										name="check"
										size="sm"
									/>
								</button>
								<button
									type="button"
									class="text-subtle-2 hover:text-gray-9 p-1 pr-1.5"
									aria-label="Cancel rename"
									onclick={cancelRename}
								>
									<Icon
										name="close"
										size="sm"
									/>
								</button>
							</div>
						{:else}
							<div
								class="border-medium bg-light hover:border-gray-6 flex w-full items-center rounded border"
								data-favorite-id={favorite.id}
							>
								<button
									type="button"
									class="text-gray-9 flex-1 truncate py-1.5 pl-2 pr-2 text-left text-sm"
									title={favorite.input}
									onclick={() => selectFavorite(favorite)}
								>
									{favorite.name}
								</button>
								<span class="text-subtle-2 whitespace-nowrap px-2 text-xs">
									{formatTime(favorite.createdOn)}
								</span>
								<FloatingMenu
									isOpen={openMenuID === favorite.id}
									onChange={(open) => (openMenuID = open ? favorite.id : null)}
									label={`Actions for favorite ${favorite.name}`}
									placement="bottom-end"
									buttonCX="text-subtle-2 hover:text-gray-9 p-1 pr-1.5 flex items-center"
								>
									<KebabSvg slot="control" />
									<svelte:fragment slot="items">
										{#if onRenameFavorite}
											<ContextMenuItem
												icon="edit"
												on:click={() => startRename(favorite)}
											>
												Rename
											</ContextMenuItem>
										{/if}
										{#if onRemoveFavorite}
											<ContextMenuItem
												icon="trash-can-outline"
												variant="danger"
												on:click={() => removeFromMenu(favorite)}
											>
												Delete
											</ContextMenuItem>
										{/if}
									</svelte:fragment>
								</FloatingMenu>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<ErrorDisplay
		class="p-4"
		lastError={new Error(
			`DoCommand for ${getResourceAPI(
				resource
			)} is not supported in the UI. Consider using one of our SDKs.`
		)}
	/>
{/if}
