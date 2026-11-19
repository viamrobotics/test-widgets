<script lang="ts">
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import { createCameraChoice } from './camera-choice.svelte'
	import CameraSelect from './camera-select.svelte'
	import CaptureAllFromCameraWidget from './capture-all-from-camera-widget.svelte'
	import GetClassificationsFromCameraWidget from './get-classifications-from-camera-widget.svelte'
	import GetClassificationsWidget from './get-classifications-widget.svelte'
	import GetDetectionsFromCameraWidget from './get-detections-from-camera-widget.svelte'
	import GetDetectionsWidget from './get-detections-widget.svelte'
	import GetObjectPointCloudsWidget from './get-object-point-clouds-widget.svelte'
	import GetPropertiesWidget from './get-properties-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const choice = createCameraChoice(() => partID)

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	// GetProperties is read once here to decide which sections show.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	// Each section shows until GetProperties answers, and hides only on an answered `false`.
	const showDetections = $derived(propertiesQuery.data?.detectionsSupported !== false)
	const showClassifications = $derived(propertiesQuery.data?.classificationsSupported !== false)
	const showObjectPointClouds = $derived(propertiesQuery.data?.objectPointCloudsSupported !== false)
</script>

<div class="flex flex-col gap-4">
	<CameraSelect {choice} />
	<CaptureAllFromCameraWidget
		{partID}
		{resourceName}
		cameraName={choice.cameraName}
	/>
	{#if showDetections}
		<GetDetectionsFromCameraWidget
			{partID}
			{resourceName}
			cameraName={choice.cameraName}
		/>
	{/if}
	{#if showClassifications}
		<GetClassificationsFromCameraWidget
			{partID}
			{resourceName}
			cameraName={choice.cameraName}
		/>
	{/if}
	{#if showObjectPointClouds}
		<GetObjectPointCloudsWidget
			{partID}
			{resourceName}
			cameraName={choice.cameraName}
		/>
	{/if}
	{#if showDetections}
		<GetDetectionsWidget
			{partID}
			{resourceName}
		/>
	{/if}
	{#if showClassifications}
		<GetClassificationsWidget
			{partID}
			{resourceName}
		/>
	{/if}
	<GetPropertiesWidget
		{partID}
		{resourceName}
	/>
</div>
