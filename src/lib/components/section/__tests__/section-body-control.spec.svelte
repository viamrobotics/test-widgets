<script lang="ts">
	import { useSectionLoading } from '../section-loading'

	const loading = useSectionLoading()
</script>

<button
	type="button"
	disabled={loading.isLoading}
>
	Execute
</button>
