import type { Snippet } from 'svelte';

import type { appRobotApi } from '@viamrobotics/sdk';

export interface ComponentPreview {
	component: appRobotApi.ComponentConfig;
	preview: string | undefined;
	loading: boolean;
}

export type ComponentPreviewSnippet = Snippet<[ComponentPreview]>;
export type ComponentPreviews = Record<string, ComponentPreview>;
