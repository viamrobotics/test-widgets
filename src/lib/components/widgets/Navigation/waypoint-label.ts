/**
 * The label for a waypoint row, `Waypoint <n>`, 1-based in GetWaypoints' order.
 *
 * @param index The waypoint's zero-based position in GetWaypoints' response.
 */
export const waypointLabel = (index: number) => `Waypoint ${index + 1}`
