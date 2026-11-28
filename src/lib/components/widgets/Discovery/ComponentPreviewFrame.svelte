<script lang="ts">
	import { Progress } from '@viamrobotics/prime-ui'
	import { type appRobotApi, DiscoveryClient, type JsonValue } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { Section } from '#lib/components/Section/index.js'

	import type { ComponentPreview, ComponentPreviewSnippet } from './component-preview'

	interface Props {
		partID: string
		resourceName: string
		/** The variant the block's controls select. A new variant loads a new preview. */
		variant: appRobotApi.ComponentConfig
		componentPreview: ComponentPreviewSnippet
	}

	const { partID, resourceName, variant, componentPreview }: Props = $props()

	const client = createResourceClient(
		DiscoveryClient,
		() => partID,
		() => resourceName
	)

	// A query keyed by the variant's attributes, so a pick that changes them loads its own preview.
	const previewQuery = createResourceQuery(
		client,
		'doCommand',
		(): Parameters<DiscoveryClient['doCommand']> => [
			{ command: 'preview', attributes: variant.attributes?.toJson() ?? {} },
		],
		{ refetchInterval: false }
	)

	/** The `preview` string of a `preview` DoCommand result, or undefined when it has none. */
	const previewText = (result: JsonValue | undefined): string | undefined => {
		if (typeof result !== 'object' || result === null || Array.isArray(result)) return undefined
		const { preview } = result
		return typeof preview === 'string' ? preview : undefined
	}

	const preview = $derived<ComponentPreview>({
		component: variant,
		preview: previewText(previewQuery.data),
		loading: previewQuery.isFetching,
	})
</script>

<div class="flex w-full min-w-0 flex-col gap-1">
	{#if previewQuery.isFetching}
		<Progress label="Loading preview" />
	{/if}
	{@render componentPreview(preview)}
	<Section.Error error={previewQuery.error} />
</div>
