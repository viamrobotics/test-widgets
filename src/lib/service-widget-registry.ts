import type { ResourceName } from '@viamrobotics/sdk'

import type {
	ResourceAPIWidget,
	ResourceWidget,
	ResourceWidgetEntry,
} from './resource-widget-types.ts'

import DiscoveryWidget from './components/widgets/discovery/discovery.svelte'
import MLModelServiceWidget from './components/widgets/ml-model-service/ml-model-service.svelte'
import NavigationServiceWidget from './components/widgets/navigation/navigation.svelte'
import SlamGetPositionWidget from './components/widgets/slam/get-position-widget.svelte'
import SlamWidget from './components/widgets/slam/slam.svelte'
import VisionServiceWidget from './components/widgets/vision-service/vision-service.svelte'
import { getResourceAPI } from './get-resource-api.ts'
import { type ResourceTriplet, ResourceTriplets } from './resource-triplet.ts'

/**
 * Widgets for `rdk:service:*` resources. Some of these (navigation) pull in heavy
 * optional peers (`maplibre-gl`, `@viamrobotics/three`), so this module is imported
 * only by the full registry and by consumers that opt into service widgets — never by
 * {@link ./component-widget-registry.ts}.
 */
export const serviceWidgetRegistry: Partial<Record<ResourceTriplet, ResourceWidgetEntry>> = {
	[ResourceTriplets.Discovery]: { widget: DiscoveryWidget, apis: [] },
	[ResourceTriplets.MLModel]: { widget: MLModelServiceWidget, apis: [] },
	[ResourceTriplets.Navigation]: { widget: NavigationServiceWidget, apis: [] },
	[ResourceTriplets.Slam]: {
		widget: SlamWidget,
		apis: [{ id: 'get-position', label: 'GetPosition', widgets: [SlamGetPositionWidget] }],
	},
	[ResourceTriplets.Vision]: { widget: VisionServiceWidget, apis: [] },
}

/**
 * Returns a service resource's individual API widgets, or `[]` for a service with only
 * a composite card and for anything that is not a recognized service.
 */
export const serviceApiWidgets = (resource: ResourceName): ResourceAPIWidget[] =>
	serviceWidgetRegistry[getResourceAPI(resource) as ResourceTriplet]?.apis ?? []

/** Returns the composite card for a service resource, or `undefined` if none exists. */
export const serviceWidgetForResource = (resource: ResourceName): ResourceWidget | undefined =>
	serviceWidgetRegistry[getResourceAPI(resource) as ResourceTriplet]?.widget

// The prop/return types of the APIs above, so service-widget consumers can type their
// usage without importing from the root entry.
export type { ResourceAPIWidget, ResourceWidget, ResourceWidgetProps } from './resource-widget-types.ts'
