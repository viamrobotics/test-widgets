<script
	lang="ts"
	module
>
	import type { Component } from 'svelte'

	/**
	 * Props of the pane fixture. A spec binds `TProps` by annotating the fixture as
	 * `Component<InPaneProps<ComponentProps<typeof Subject>>>`, because `render` reads a generic
	 * component's props at its constraint.
	 */
	export interface InPaneProps<TProps extends object> {
		widget: Component<TProps>
		props: TProps
		/** Pane width in px. */
		width: number
	}
</script>

<script
	lang="ts"
	generics="TProps extends object"
>
	import '../../../../../../app.css'

	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

	const { widget: Widget, props, width }: InPaneProps<TProps> = $props()

	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<div
		data-testid="pane"
		style:width="{width}px"
	>
		<Widget {...props} />
	</div>
</QueryClientProvider>
