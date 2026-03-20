<script lang="ts">
	import { Button } from '@viamrobotics/prime-core';

	interface Props {
		data: Uint8Array;
	}

	const { data }: Props = $props();

	const downloadRawData = () => {
		const file = new File([data], 'pointcloud.pcd', {
			type: 'pointcloud/pcd'
		});
		const url = URL.createObjectURL(file);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'pointcloud.pcd';
		link.click();

		URL.revokeObjectURL(url);
	};
</script>

<Button onclick={downloadRawData}>Download raw data</Button>
