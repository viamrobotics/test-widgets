export { default as ConnectionStatus } from './connection-status.svelte'
export { Section } from './section'

export { default as ArmWidget } from './widgets/arm/arm.svelte'
export { default as ArmGetJointPositionsWidget } from './widgets/arm/get-joint-positions-widget.svelte'
export { default as ArmGetEndPositionWidget } from './widgets/arm/get-end-position-widget.svelte'
export { default as ArmGetManualModeWidget } from './widgets/arm/get-manual-mode-widget.svelte'
export { default as ArmGetPropertiesWidget } from './widgets/arm/get-properties-widget.svelte'
export { default as ArmSetManualModeWidget } from './widgets/arm/set-manual-mode-widget.svelte'
export { default as ArmIsMovingWidget } from './widgets/arm/is-moving-widget.svelte'
export { default as ArmManualModeControl } from './widgets/arm/manual-mode-widget.svelte'
export {
	/** @deprecated Use `ArmManualModeControl`. Removed in the next major. */
	default as ArmManualModeWidget,
} from './widgets/arm/manual-mode-widget.svelte'
export { default as ArmMoveToJointPositionsWidget } from './widgets/arm/move-to-joint-positions-widget.svelte'
export { default as ArmMoveToPositionWidget } from './widgets/arm/move-to-position-widget.svelte'
export { default as ArmStopWidget } from './widgets/arm/stop-widget.svelte'

export { default as AudioInputWidget } from './widgets/audio-input/audio-input.svelte'
export { default as AudioInputControls } from './widgets/audio-input/audio-input-controls.svelte'
export { default as AudioInputGetAudioWidget } from './widgets/audio-input/get-audio-widget.svelte'
export { default as AudioInputGetPropertiesWidget } from './widgets/audio-input/get-properties-widget.svelte'

export { default as AudioOutputWidget } from './widgets/audio-output/audio-output.svelte'
export { default as AudioOutputControls } from './widgets/audio-output/audio-output-controls.svelte'
export { default as AudioOutputPlayStreamWidget } from './widgets/audio-output/play-stream-widget.svelte'
export { default as AudioOutputPlayWidget } from './widgets/audio-output/play-widget.svelte'
export { default as AudioOutputGetPropertiesWidget } from './widgets/audio-output/get-properties-widget.svelte'

export { default as BaseWidget } from './widgets/base/base.svelte'
export { default as BaseGetPropertiesWidget } from './widgets/base/get-properties-widget.svelte'
export { default as BaseIsMovingWidget } from './widgets/base/is-moving-widget.svelte'
export { default as BaseMoveStraightWidget } from './widgets/base/move-straight-widget.svelte'
export { default as BaseQuickMoveControl } from './widgets/base/quick-move-widget.svelte'
export {
	/** @deprecated Use `BaseQuickMoveControl`. Removed in the next major. */
	default as BaseQuickMoveWidget,
} from './widgets/base/quick-move-widget.svelte'
export { default as BaseSetPowerWidget } from './widgets/base/set-power-widget.svelte'
export { default as BaseSetVelocityWidget } from './widgets/base/set-velocity-widget.svelte'
export { default as BaseSpinWidget } from './widgets/base/spin-widget.svelte'
export { default as BaseStopWidget } from './widgets/base/stop-widget.svelte'

export { default as BoardGetDigitalInterruptValueWidget } from './widgets/board/get-digital-interrupt-value-widget.svelte'
export { default as BoardGetGPIOWidget } from './widgets/board/get-gpio-widget.svelte'
export { default as BoardPWMFrequencyWidget } from './widgets/board/pwm-frequency-widget.svelte'
export { default as BoardPWMWidget } from './widgets/board/pwm-widget.svelte'
export { default as BoardReadAnalogReaderWidget } from './widgets/board/read-analog-reader-widget.svelte'
export { default as BoardSetGPIOWidget } from './widgets/board/set-gpio-widget.svelte'
export { default as BoardSetPowerModeWidget } from './widgets/board/set-power-mode-widget.svelte'
export { default as BoardSetPWMFrequencyWidget } from './widgets/board/set-pwm-frequency-widget.svelte'
export { default as BoardSetPWMWidget } from './widgets/board/set-pwm-widget.svelte'
export { default as BoardStreamTicksWidget } from './widgets/board/stream-ticks-widget.svelte'
export { default as BoardWriteAnalogWidget } from './widgets/board/write-analog-widget.svelte'
export { default as BoardWidget } from './widgets/board/board.svelte'
export { default as BoardControls } from './widgets/board/read-write-pins-widget.svelte'
export {
	/** @deprecated Use `BoardControls`. Removed in the next major. */
	default as BoardReadWritePinsWidget,
} from './widgets/board/read-write-pins-widget.svelte'

export { default as ButtonWidget } from './widgets/button/button.svelte'
export { default as ButtonPushWidget } from './widgets/button/push.svelte'

export { default as CameraWidget } from './widgets/camera/camera.svelte'
export { default as CameraControls } from './widgets/camera/camera-controls.svelte'
export { default as CameraGetImagesWidget } from './widgets/camera/get-images-widget.svelte'
export { default as CameraGetPointCloudWidget } from './widgets/camera/get-point-cloud-widget.svelte'
export { default as CameraGetPropertiesWidget } from './widgets/camera/get-properties-widget.svelte'
export { default as LiveOrPollingVideo } from './widgets/camera/live-or-polling-video.svelte'

export type {
	ComponentPreview,
	ComponentPreviewSnippet,
} from './widgets/discovery/component-preview.ts'
export { default as DiscoveryWidget } from './widgets/discovery/discovery.svelte'
export { default as DiscoveryControls } from './widgets/discovery/discovery-controls.svelte'
export { default as DiscoveryDiscoverResourcesWidget } from './widgets/discovery/discover-resources-widget.svelte'

export { default as DoCommandWidget } from './widgets/do-command/do-command.svelte'
export { default as ResourceDoCommandWidget } from './widgets/do-command/resource-do-command.svelte'

export { default as EncoderGetPropertiesWidget } from './widgets/encoder/get-properties-widget.svelte'
export { default as EncoderResetPositionWidget } from './widgets/encoder/reset-position-widget.svelte'
export { default as EncoderWidget } from './widgets/encoder/encoder.svelte'
export { default as EncoderGetPositionWidget } from './widgets/encoder/get-position-widget.svelte'

export { default as GantryStopWidget } from './widgets/gantry/stop-widget.svelte'
export { default as GantryWidget } from './widgets/gantry/gantry.svelte'
export { default as GantryGetPositionWidget } from './widgets/gantry/get-position-widget.svelte'
export { default as GantryIsMovingWidget } from './widgets/gantry/is-moving-widget.svelte'
export { default as GantryGetLengthsWidget } from './widgets/gantry/get-lengths-widget.svelte'
export { default as GantryHomeWidget } from './widgets/gantry/home.svelte'
export { default as GantryMoveToPositionWidget } from './widgets/gantry/move-to-position-widget.svelte'
export { default as GantryQuickMoveControl } from './widgets/gantry/quick-move-widget.svelte'
export {
	/** @deprecated Use `GantryQuickMoveControl`. Removed in the next major. */
	default as GantryQuickMoveWidget,
} from './widgets/gantry/quick-move-widget.svelte'

export { default as GenericWidget } from './widgets/generic/generic.svelte'

export { default as GripperGetCurrentInputsWidget } from './widgets/gripper/get-current-inputs-widget.svelte'
export { default as GripperGrabWidget } from './widgets/gripper/grab-widget.svelte'
export { default as GripperWidget } from './widgets/gripper/gripper.svelte'
export { default as GripperGoToInputsWidget } from './widgets/gripper/go-to-inputs-widget.svelte'
export { default as GripperIsHoldingSomethingWidget } from './widgets/gripper/is-holding-something-widget.svelte'
export { default as GripperIsMovingWidget } from './widgets/gripper/is-moving-widget.svelte'
export { default as GripperOpenGrabControl } from './widgets/gripper/open-grab-control.svelte'
export {
	/** @deprecated Use `GripperOpenGrabControl`. Removed in the next major. */
	default as GripperOpenGrabWidget,
} from './widgets/gripper/open-grab-control.svelte'
export { default as GripperOpenWidget } from './widgets/gripper/open-widget.svelte'
export { default as GripperStopWidget } from './widgets/gripper/stop-widget.svelte'

export { default as InputControllerGetEventsWidget } from './widgets/input-controller/get-events-widget.svelte'
export { default as InputControllerTriggerEventWidget } from './widgets/input-controller/trigger-event-widget.svelte'
export { default as InputControllerWidget } from './widgets/input-controller/input-controller.svelte'

export { default as MLModelServiceInferWidget } from './widgets/ml-model-service/infer-widget.svelte'
export { default as MLModelServiceMetadataWidget } from './widgets/ml-model-service/metadata-widget.svelte'
export { default as MLModelServiceWidget } from './widgets/ml-model-service/ml-model-service.svelte'

export { default as MotionServiceWidget } from './widgets/motion/motion.svelte'
export { default as MotionMoveWidget } from './widgets/motion/move-widget.svelte'

export { default as MotorGoForWidget } from './widgets/motor/go-for-view.svelte'
export { default as MotorGoToWidget } from './widgets/motor/go-to-view.svelte'
export { default as MotorWidget } from './widgets/motor/motor.svelte'
export { default as MotorGetPositionWidget } from './widgets/motor/get-position-widget.svelte'
export { default as MotorGetPropertiesWidget } from './widgets/motor/get-properties-widget.svelte'
export { default as MotorIsPoweredWidget } from './widgets/motor/is-powered-widget.svelte'
export { default as MotorResetZeroPositionWidget } from './widgets/motor/reset-zero-position-widget.svelte'
export { default as MotorStopWidget } from './widgets/motor/stop-widget.svelte'
export { default as MotorIsMovingWidget } from './widgets/motor/is-moving-widget.svelte'
export { default as MotorQuickMoveControl } from './widgets/motor/quick-move-widget.svelte'
export {
	/** @deprecated Use `MotorQuickMoveControl`. Removed in the next major. */
	default as MotorQuickMoveWidget,
} from './widgets/motor/quick-move-widget.svelte'
export { default as MotorSetPowerWidget } from './widgets/motor/set-power-widget.svelte'
export { default as MotorSetRPMWidget } from './widgets/motor/set-rpm-widget.svelte'

export { default as MovementSensorGetReadingsWidget } from './widgets/movement-sensor/get-readings-widget.svelte'
export { default as MovementSensorWidget } from './widgets/movement-sensor/movement-sensor.svelte'
export { default as MovementSensorGetPropertiesWidget } from './widgets/movement-sensor/get-properties-widget.svelte'
export { default as MovementSensorGetPositionWidget } from './widgets/movement-sensor/get-position-widget.svelte'
export { default as MovementSensorGetLinearAccelerationWidget } from './widgets/movement-sensor/get-linear-acceleration-widget.svelte'
export { default as MovementSensorGetLinearVelocityWidget } from './widgets/movement-sensor/get-linear-velocity-widget.svelte'
export { default as MovementSensorGetOrientationWidget } from './widgets/movement-sensor/get-orientation-widget.svelte'
export { default as MovementSensorGetAngularVelocityWidget } from './widgets/movement-sensor/get-angular-velocity-widget.svelte'
export { default as MovementSensorGetCompassHeadingWidget } from './widgets/movement-sensor/get-compass-heading-widget.svelte'
export { default as MovementSensorGetAccuracyWidget } from './widgets/movement-sensor/get-accuracy-widget.svelte'

export { default as NavigationServiceWidget } from './widgets/navigation/navigation.svelte'
export { default as NavigationServiceControls } from './widgets/navigation/navigation-controls.svelte'
export { default as NavigationGetModeWidget } from './widgets/navigation/get-mode-widget.svelte'
export { default as NavigationSetModeWidget } from './widgets/navigation/set-mode-widget.svelte'
export { default as NavigationGetLocationWidget } from './widgets/navigation/get-location-widget.svelte'
export { default as NavigationGetPathsWidget } from './widgets/navigation/get-paths-widget.svelte'
export { default as NavigationGetPropertiesWidget } from './widgets/navigation/get-properties-widget.svelte'
export { default as NavigationGetWaypointsWidget } from './widgets/navigation/get-waypoints-widget.svelte'
export { default as NavigationAddWaypointWidget } from './widgets/navigation/add-waypoint-widget.svelte'
export { default as NavigationRemoveWaypointWidget } from './widgets/navigation/remove-waypoint-widget.svelte'
export { default as NavigationGetObstaclesWidget } from './widgets/navigation/get-obstacles-widget.svelte'

export { default as PowerSensorWidget } from './widgets/power-sensor/power-sensor.svelte'
export { default as PowerSensorGetReadingsWidget } from './widgets/power-sensor/get-readings-widget.svelte'
export { default as PowerSensorGetVoltageWidget } from './widgets/power-sensor/get-voltage-widget.svelte'
export { default as PowerSensorGetCurrentWidget } from './widgets/power-sensor/get-current-widget.svelte'
export { default as PowerSensorGetPowerWidget } from './widgets/power-sensor/get-power-widget.svelte'

export { default as SensorWidget } from './widgets/sensor/sensor.svelte'

export { default as ServoGetPositionWidget } from './widgets/servo/get-position-widget.svelte'
export { default as ServoMoveWidget } from './widgets/servo/move-widget.svelte'
export { default as ServoQuickMoveControl } from './widgets/servo/quick-move-widget.svelte'
export {
	/** @deprecated Use `ServoQuickMoveControl`. Removed in the next major. */
	default as ServoQuickMoveWidget,
} from './widgets/servo/quick-move-widget.svelte'
export { default as ServoWidget } from './widgets/servo/servo.svelte'
export { default as ServoIsMovingWidget } from './widgets/servo/is-moving-widget.svelte'
export { default as ServoStopWidget } from './widgets/servo/stop-widget.svelte'

export { default as SlamMap2D } from './slam/map2d/index.svelte'
export { default as SlamWidget } from './widgets/slam/slam.svelte'
export { default as SlamControls } from './widgets/slam/slam-controls.svelte'
export { default as SlamGetPositionWidget } from './widgets/slam/get-position-widget.svelte'
export { default as SlamGetInternalStateWidget } from './widgets/slam/get-internal-state-widget.svelte'
export { default as SlamGetPointCloudMapWidget } from './widgets/slam/get-point-cloud-map-widget.svelte'
export { default as SlamGetPropertiesWidget } from './widgets/slam/get-properties-widget.svelte'

export { default as StopWidget } from './stop.svelte'

export { default as SwitchGetNumberOfPositionsWidget } from './widgets/switch/get-number-of-positions-widget.svelte'
export { default as SwitchGetPositionWidget } from './widgets/switch/get-position-widget.svelte'
export { default as SwitchPositionWidget } from './widgets/switch/position-view.svelte'
export { default as SwitchWidget } from './widgets/switch/switch.svelte'

export { labelToColor } from './widgets/vision-service/color'
export { getImageSize, type Size } from './widgets/vision-service/get-image-size'
export { default as VisionServiceWidget } from './widgets/vision-service/vision-service.svelte'
export { default as VisionServiceControls } from './widgets/vision-service/vision-service-controls.svelte'
export { default as VisionServiceCaptureAllFromCameraWidget } from './widgets/vision-service/capture-all-from-camera-widget.svelte'
export { default as VisionServiceGetPropertiesWidget } from './widgets/vision-service/get-properties-widget.svelte'
export { default as VisionServiceGetObjectPointCloudsWidget } from './widgets/vision-service/get-object-point-clouds-widget.svelte'
export { default as VisionServiceGetDetectionsFromCameraWidget } from './widgets/vision-service/get-detections-from-camera-widget.svelte'
export { default as VisionServiceGetClassificationsFromCameraWidget } from './widgets/vision-service/get-classifications-from-camera-widget.svelte'
export { default as VisionServiceGetDetectionsWidget } from './widgets/vision-service/get-detections-widget.svelte'
export { default as VisionServiceGetClassificationsWidget } from './widgets/vision-service/get-classifications-widget.svelte'

export { default as RefetchController } from './refetch-controller.svelte'

export {
	NavigationMap,
	NavigationTab,
	type NavigationTabType,
	type Shapes,
	type CapsuleGeometry,
	type SphereGeometry,
	type BoxGeometry,
	type Geometry,
	type Obstacle,
	type Path,
} from './navigation-map'

export {
	MapLibre,
	MapLibreMarker,
	CenterControls,
	FollowControls,
	NavigationControls,
	SatelliteControls,
	DirectionalMarker,
	LngLatInput,
	MapProviders,
	type MapProvider,
	GeoPose,
	Waypoint,
	useMapLibre,
	useMapLibreEvent,
	useMapLibreThreeRaycast,
	useMapLibreThreeRenderer,
	lngLatToMercator,
	mercatorToCartesian,
	lngLatToCartesian,
	cartesianToMercator,
	cartesianToLngLat,
} from './maplibre'

export { default as CustomControlWidget } from './widgets/custom-control/custom-control.svelte'

export {
	CUSTOM_CONTROL_COMMAND,
	CUSTOM_CONTROL_CSP,
	type CustomControlArtifact,
	loadCustomControl,
	prepareArtifact,
} from './widgets/custom-control/custom-control.ts'
