<script lang="ts">
	interface Props {
		partID: string
		resourceName: string
	}

	// Rendered by createResourceWidget when a resource has no test widget.
	// Accepts the standard widget props so it satisfies the uniform widget interface.
	const { partID, resourceName }: Props = $props()
</script>

<p
	class="text-subtle-2 p-4 text-sm"
	data-part-id={partID}
>
	No test widget is implemented for {resourceName || 'this resource'}.
</p>
