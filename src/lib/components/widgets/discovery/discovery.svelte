<script lang="ts">
	import { isEqual } from 'lodash-es';

	import { appRobotApi, DiscoveryClient, Struct } from '@viamrobotics/sdk';
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery
	} from '@viamrobotics/svelte-sdk';

	import ApiSection from '$lib/components/api-section.svelte';
	import ConnectionStatus from '$lib/components/connection-status.svelte';
	import Query from '$lib/components/query.svelte';
	import { createRefetchIntervalStore, RefetchIntervals } from '$lib/components/refetch-controller';
	import RefetchController from '$lib/components/refetch-controller.svelte';
	import type { ComponentPreviews, ComponentPreviewSnippet } from './component-preview';
	import ResourcesList from './resources-list.svelte';

	interface Props {
		partID: string;
		resourceName: string;
		/**  A handler for adding a component to the robot. */
		onAddComponent?: ((component: appRobotApi.ComponentConfig) => void) | undefined;
		/** A snippet for creating component previews. Requires a `preview` DoCommand to be implemented. */
		componentPreview?: ComponentPreviewSnippet;
	}

	const { partID, resourceName, onAddComponent, componentPreview }: Props = $props();

	const refetchInterval = createRefetchIntervalStore(
		partID,
		resourceName,
		'discovery-card',
		RefetchIntervals.MANUAL
	);

	const previews = $state<ComponentPreviews>({});
	let discoveries = $state.raw<appRobotApi.ComponentConfig[]>([]);
	let discoveriesUpdated = $state(false);

	const client = createResourceClient(
		DiscoveryClient,
		() => partID,
		() => resourceName
	);

	const discoveryQuery = createResourceQuery(client, 'discoverResources', () => ({
		refetchInterval: $refetchInterval
	}));

	const doCommandMutation = createResourceMutation(client, 'doCommand');

	const makeDoCommandMutation = async (component: appRobotApi.ComponentConfig) => {
		const parsedInput = Struct.fromJson({
			command: 'preview',
			attributes: component.attributes?.toJson() ?? {}
		});

		try {
			const result = await doCommandMutation.mutateAsync([parsedInput]);

			const data = JSON.parse(JSON.stringify(result) ?? '{}') as {
				preview: string;
			};
			previews[component.name] = {
				component,
				preview: data.preview,
				loading: false
			};
		} catch {
			previews[component.name] = {
				component,
				preview: undefined,
				loading: false
			};
		}
	};

	const makeDoCommandMutations = async (components: appRobotApi.ComponentConfig[]) => {
		const [currentComponent, ...remainingComponents] = components;
		if (currentComponent === undefined) {
			return;
		}

		await makeDoCommandMutation(currentComponent);

		if (remainingComponents.length > 0) {
			await makeDoCommandMutations(remainingComponents);
		}
	};

	$effect(() => {
		if (discoveryQuery.isFetching) {
			discoveriesUpdated = true;
		}
	});

	$effect(() => {
		if (discoveryQuery.isSuccess) {
			if (isEqual(discoveries, discoveryQuery.data)) {
				discoveriesUpdated = false;
			} else {
				discoveries = discoveryQuery.data;
			}
		}
	});

	$effect(() => {
		if (discoveries && discoveriesUpdated && componentPreview !== undefined) {
			for (const discovery of discoveries) {
				previews[discovery.name] = {
					component: discovery,
					preview: undefined,
					loading: true
				};
			}

			void makeDoCommandMutations(discoveries);
		}
	});
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4 pb-3">
			<RefetchController
				{refetchInterval}
				queries={[discoveryQuery]}
			/>
		</div>

		<ApiSection
			title="DiscoverResources"
			class="relative"
		>
			<Query
				query={discoveryQuery}
				contentCx="h-6"
			>
				{#if discoveryQuery.data !== undefined}
					<ResourcesList
						data={discoveryQuery.data}
						{previews}
						{componentPreview}
						{onAddComponent}
					/>
				{/if}
			</Query>
		</ApiSection>
	{/snippet}
</ConnectionStatus>
