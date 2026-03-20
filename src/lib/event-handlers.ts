export const numberValueFromEvent = (event: Event): number | undefined => {
	const target = event.target as HTMLInputElement;
	const val = target.valueAsNumber;
	return Number.isFinite(val) ? val : undefined;
};
