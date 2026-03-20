import { getContext, setContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { MathUtils } from 'three';

import type { Detection as DetectionPb } from '@viamrobotics/sdk';

import { labelToColor } from './color.ts';

export interface Detection extends DetectionPb {
	id: string;
	color: string;
}

/**
 * Adds ids to detections.
 */
export const addIdsToDetections = (detections: DetectionPb[]): Detection[] => {
	for (const detection of detections as Detection[]) {
		detection.id = MathUtils.generateUUID();
		detection.confidence = Math.round(detection.confidence * 100);
		detection.color = labelToColor(detection.className);
	}

	return detections as Detection[];
};

interface DetectionGroup {
	color: string;
	detections: Detection[];
}

export interface DetectionsContext {
	readonly current: Detection[];
	readonly byLabel: Record<string, DetectionGroup>;
	readonly hovered: SvelteSet<string>;
}

export const DETECTIONS_CONTEXT_KEY = Symbol('detections-context');

const categorize = (list: Detection[]) => {
	const labels: Record<string, DetectionGroup> = {};

	for (const detection of list) {
		labels[detection.className] ??= {
			color: labelToColor(detection.className),
			detections: []
		};
		labels[detection.className]?.detections.push(detection);
	}

	return labels;
};

export const createDetectionContext = (getDetections: () => DetectionPb[]): DetectionsContext => {
	const detections = $derived<Detection[]>(addIdsToDetections(getDetections()));
	const detectionsByLabel = $derived(categorize(detections));
	const hovered = new SvelteSet<string>();

	const context: DetectionsContext = {
		get current() {
			return detections;
		},
		get byLabel() {
			return detectionsByLabel;
		},
		hovered
	};

	return context;
};

export const provideDetectionsContext = (next: () => DetectionPb[]): DetectionsContext => {
	const context = createDetectionContext(next);
	setContext<DetectionsContext>(DETECTIONS_CONTEXT_KEY, context);
	return context;
};

export const useDetections = (): DetectionsContext => {
	return getContext<DetectionsContext>(DETECTIONS_CONTEXT_KEY);
};
