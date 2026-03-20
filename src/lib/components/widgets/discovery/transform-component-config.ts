import { omit } from 'lodash-es';

import { appRobotApi, type JsonValue } from '@viamrobotics/sdk';

// The below code was copied from `ui/src/lib/resource-type.ts`
const TRIPLET_SEPARATOR = ':';

type ResourceTripletString =
	`${string}${typeof TRIPLET_SEPARATOR}${string}${typeof TRIPLET_SEPARATOR}${string}`;

/** Check if a string is a valid API or model triplet. */
const isResourceTriplet = (value: string | undefined): value is ResourceTripletString => {
	const parts = value?.split(TRIPLET_SEPARATOR);

	return parts?.length === 3 && Boolean(parts[0] && parts[1] && parts[2]);
};

/** An app-safe version of the resource config without deprecated fields. */
export type SafeResourceConfig = Omit<appRobotApi.ComponentConfig, 'namespace' | 'type'>;

type SortableComponentConfig = appRobotApi.ComponentConfig & Record<string, unknown>;

/**
 * Transforms the provided component config to ensure it is safe to add the machine part's config
 *
 * @param resource The resource config to validate
 */
export const transformComponentConfig = (resource: appRobotApi.ComponentConfig) => {
	const hasQualifiedAPI = isResourceTriplet(resource.api);
	const hasQualifiedModel = isResourceTriplet(resource.model);
	let next: SafeResourceConfig = resource.clone();

	if (hasQualifiedAPI && hasQualifiedModel) {
		next = omit(next, 'namespace');
		next = omit(next, 'type');
	}

	return new appRobotApi.ComponentConfig(next).toJson() as SortableComponentConfig;
};

/**
 * Parses the provided component config json to add to a part's config
 *
 * @param resource The resource json to parse
 */
export const parseComponentConfig = (resource: Record<string, unknown>) => {
	return appRobotApi.ComponentConfig.fromJson(resource as JsonValue);
};
