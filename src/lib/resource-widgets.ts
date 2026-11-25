import type { ResourceName } from '@viamrobotics/sdk'

import type { ResourceWidgetsEntry } from './resource-widget-types.ts'

import * as Arm from './components/widgets/Arm/index.ts'
import * as AudioInput from './components/widgets/AudioInput/index.ts'
import * as AudioOutput from './components/widgets/AudioOutput/index.ts'
import * as Base from './components/widgets/Base/index.ts'
import * as Board from './components/widgets/Board/index.ts'
import * as Button from './components/widgets/Button/index.ts'
import * as Camera from './components/widgets/Camera/index.ts'
import * as Discovery from './components/widgets/Discovery/index.ts'
import * as Encoder from './components/widgets/Encoder/index.ts'
import * as Gantry from './components/widgets/Gantry/index.ts'
import * as Gripper from './components/widgets/Gripper/index.ts'
import * as InputController from './components/widgets/InputController/index.ts'
import * as MLModel from './components/widgets/MLModel/index.ts'
import * as Motion from './components/widgets/Motion/index.ts'
import * as Motor from './components/widgets/Motor/index.ts'
import * as MovementSensor from './components/widgets/MovementSensor/index.ts'
import * as Navigation from './components/widgets/Navigation/index.ts'
import * as PowerSensor from './components/widgets/PowerSensor/index.ts'
import * as Sensor from './components/widgets/Sensor/index.ts'
import * as Servo from './components/widgets/Servo/index.ts'
import * as Slam from './components/widgets/Slam/index.ts'
import * as Switch from './components/widgets/Switch/index.ts'
import * as Vision from './components/widgets/Vision/index.ts'
import { getResourceAPI } from './get-resource-api.ts'
import { type ResourceTriplet, ResourceTriplets } from './resource-triplet.ts'

/**
 * Every resource's widgets, keyed by API triplet. Importing this pulls every widget, and its
 * optional peers, into the build, which is why the catalog sits on the `./widgets` entry and not
 * the root. A host that renders one widget imports it from the root and pays for nothing else.
 *
 * Each widget's key is its namespace member in camelCase, in the namespace's export order.
 */
export const resourceWidgets = {
	[ResourceTriplets.Arm]: {
		widgets: {
			jog: {
				component: Arm.Jog,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			joints: {
				component: Arm.Joints,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			moveToJointPositions: {
				component: Arm.MoveToJointPositions,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			moveToPosition: {
				component: Arm.MoveToPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'xl' },
			},
			getJointPositions: {
				component: Arm.GetJointPositions,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			getEndPosition: {
				component: Arm.GetEndPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			isMoving: {
				component: Arm.IsMoving,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			manualMode: {
				component: Arm.ManualMode,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			setManualMode: {
				component: Arm.SetManualMode,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getManualMode: {
				component: Arm.GetManualMode,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getProperties: {
				component: Arm.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			stop: {
				component: Arm.Stop,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
		},
	},
	[ResourceTriplets.Base]: {
		widgets: {
			quickMove: {
				component: Base.QuickMove,
				kind: 'control',
				size: { width: { min: 'xs', max: '2xl' }, height: 'md' },
			},
			moveStraight: {
				component: Base.MoveStraight,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			spin: {
				component: Base.Spin,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			setPower: {
				component: Base.SetPower,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			setVelocity: {
				component: Base.SetVelocity,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			isMoving: {
				component: Base.IsMoving,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			stop: {
				component: Base.Stop,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getProperties: {
				component: Base.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
		},
	},
	[ResourceTriplets.AudioInput]: {
		widgets: {
			getAudio: {
				component: AudioInput.GetAudio,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getProperties: {
				component: AudioInput.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			listen: {
				component: AudioInput.Listen,
				kind: 'control',
				size: { width: { min: 'xs', max: '2xl' }, height: 'md' },
			},
		},
	},
	[ResourceTriplets.AudioOutput]: {
		widgets: {
			play: {
				component: AudioOutput.Play,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			playStream: {
				component: AudioOutput.PlayStream,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			getProperties: {
				component: AudioOutput.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			holdToTalk: {
				component: AudioOutput.HoldToTalk,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			playFile: {
				component: AudioOutput.PlayFile,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
		},
	},
	[ResourceTriplets.Board]: {
		widgets: {
			pins: {
				component: Board.Pins,
				kind: 'control',
				size: { width: { min: 'xs', max: '2xl' }, height: 'md' },
			},
			setGpio: {
				component: Board.SetGpio,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getGpio: {
				component: Board.GetGpio,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			pwm: {
				component: Board.Pwm,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			setPwm: {
				component: Board.SetPwm,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			pwmFrequency: {
				component: Board.PwmFrequency,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			setPwmFrequency: {
				component: Board.SetPwmFrequency,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			readAnalogReader: {
				component: Board.ReadAnalogReader,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			writeAnalog: {
				component: Board.WriteAnalog,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getDigitalInterruptValue: {
				component: Board.GetDigitalInterruptValue,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			streamTicks: {
				component: Board.StreamTicks,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			setPowerMode: {
				component: Board.SetPowerMode,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			pin: {
				component: Board.Pin,
				kind: 'control',
				size: { width: { min: 'xs', max: '2xl' }, height: 'sm' },
			},
			analogReader: {
				component: Board.AnalogReader,
				kind: 'control',
				size: { width: { min: 'xs', max: '2xl' }, height: 'sm' },
			},
			digitalInterrupt: {
				component: Board.DigitalInterrupt,
				kind: 'control',
				size: { width: { min: 'xs', max: '2xl' }, height: 'sm' },
			},
			powerMode: {
				component: Board.PowerMode,
				kind: 'control',
				size: { width: { min: 'xs', max: '2xl' }, height: 'md' },
			},
		},
	},
	[ResourceTriplets.Button]: {
		widgets: {
			push: {
				component: Button.Push,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
		},
	},
	[ResourceTriplets.Camera]: {
		widgets: {
			liveFeed: {
				component: Camera.LiveFeed,
				kind: 'control',
				size: { width: { min: 'xs', max: '4xl' }, height: 'xl' },
			},
			getImages: {
				component: Camera.GetImages,
				kind: 'api',
				size: { width: { min: 'xs', max: '4xl' }, height: 'md' },
			},
			getPointCloud: {
				component: Camera.GetPointCloud,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'sm' },
			},
			getProperties: {
				component: Camera.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
		},
	},
	[ResourceTriplets.Discovery]: {
		widgets: {
			discoverResources: {
				component: Discovery.DiscoverResources,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			resourcePreview: {
				component: Discovery.ResourcePreview,
				kind: 'control',
				size: { width: { min: 'xs', max: '4xl' }, height: 'sm' },
			},
		},
	},
	[ResourceTriplets.Encoder]: {
		widgets: {
			getPosition: {
				component: Encoder.GetPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			resetPosition: {
				component: Encoder.ResetPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getProperties: {
				component: Encoder.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			zeroPosition: {
				component: Encoder.ZeroPosition,
				kind: 'control',
				size: { width: { min: 'xs', max: 'fill' }, height: 'md' },
			},
		},
	},
	[ResourceTriplets.Gantry]: {
		widgets: {
			home: {
				component: Gantry.Home,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			moveToPosition: {
				component: Gantry.MoveToPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			quickMove: {
				component: Gantry.QuickMove,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			getPosition: {
				component: Gantry.GetPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			isMoving: {
				component: Gantry.IsMoving,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getLengths: {
				component: Gantry.GetLengths,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			stop: {
				component: Gantry.Stop,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			homingStatus: {
				component: Gantry.HomingStatus,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
		},
	},
	[ResourceTriplets.Gripper]: {
		widgets: {
			openGrab: {
				component: Gripper.OpenGrab,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			status: {
				component: Gripper.Status,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			isHoldingSomething: {
				component: Gripper.IsHoldingSomething,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			isMoving: {
				component: Gripper.IsMoving,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			open: {
				component: Gripper.Open,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			grab: {
				component: Gripper.Grab,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			stop: {
				component: Gripper.Stop,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getCurrentInputs: {
				component: Gripper.GetCurrentInputs,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			goToInputs: {
				component: Gripper.GoToInputs,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
		},
	},
	[ResourceTriplets.InputController]: {
		widgets: {
			getEvents: {
				component: InputController.GetEvents,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			triggerEvent: {
				component: InputController.TriggerEvent,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			webGamepad: {
				component: InputController.WebGamepad,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			refresh: {
				component: InputController.Refresh,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
		},
	},
	[ResourceTriplets.MLModel]: {
		widgets: {
			metadata: {
				component: MLModel.Metadata,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			infer: {
				component: MLModel.Infer,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
		},
	},
	[ResourceTriplets.Motion]: {
		widgets: {
			move: {
				component: Motion.Move,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'xl' },
			},
		},
	},
	[ResourceTriplets.Motor]: {
		widgets: {
			quickMove: {
				component: Motor.QuickMove,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			move: {
				component: Motor.Move,
				kind: 'control',
				size: { width: { min: '2xl', max: '2xl' }, height: 'md' },
			},
			setPower: {
				component: Motor.SetPower,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			setRpm: {
				component: Motor.SetRpm,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			goFor: {
				component: Motor.GoFor,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			goTo: {
				component: Motor.GoTo,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			isMoving: {
				component: Motor.IsMoving,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			resetZeroPosition: {
				component: Motor.ResetZeroPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getPosition: {
				component: Motor.GetPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getProperties: {
				component: Motor.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			stop: {
				component: Motor.Stop,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			isPowered: {
				component: Motor.IsPowered,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
		},
	},
	[ResourceTriplets.MovementSensor]: {
		widgets: {
			getPosition: {
				component: MovementSensor.GetPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getOrientation: {
				component: MovementSensor.GetOrientation,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getCompassHeading: {
				component: MovementSensor.GetCompassHeading,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getAccuracy: {
				component: MovementSensor.GetAccuracy,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getLinearVelocity: {
				component: MovementSensor.GetLinearVelocity,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getAngularVelocity: {
				component: MovementSensor.GetAngularVelocity,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getLinearAcceleration: {
				component: MovementSensor.GetLinearAcceleration,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getProperties: {
				component: MovementSensor.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getReadings: {
				component: MovementSensor.GetReadings,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'lg' },
			},
			positionMap: {
				component: MovementSensor.PositionMap,
				kind: 'control',
				size: { width: { min: 'xs', max: 'fill' }, height: 'lg' },
			},
		},
	},
	[ResourceTriplets.Navigation]: {
		widgets: {
			map: {
				component: Navigation.Map,
				kind: 'control',
				size: { width: { min: 'xs', max: '4xl' }, height: 'lg' },
			},
			mode: {
				component: Navigation.Mode,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getMode: {
				component: Navigation.GetMode,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			setMode: {
				component: Navigation.SetMode,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getLocation: {
				component: Navigation.GetLocation,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getWaypoints: {
				component: Navigation.GetWaypoints,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			addWaypoint: {
				component: Navigation.AddWaypoint,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			removeWaypoint: {
				component: Navigation.RemoveWaypoint,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getObstacles: {
				component: Navigation.GetObstacles,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			getPaths: {
				component: Navigation.GetPaths,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'sm' },
			},
			getProperties: {
				component: Navigation.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'sm' },
			},
		},
	},
	[ResourceTriplets.PowerSensor]: {
		widgets: {
			getVoltage: {
				component: PowerSensor.GetVoltage,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getCurrent: {
				component: PowerSensor.GetCurrent,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getPower: {
				component: PowerSensor.GetPower,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getReadings: {
				component: PowerSensor.GetReadings,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'lg' },
			},
			readingHistory: {
				component: PowerSensor.ReadingHistory,
				kind: 'control',
				size: { width: { min: 'xs', max: 'fill' }, height: 'md' },
			},
		},
	},
	[ResourceTriplets.Sensor]: {
		widgets: {
			getReadings: {
				component: Sensor.GetReadings,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'lg' },
			},
		},
	},
	[ResourceTriplets.Servo]: {
		widgets: {
			move: {
				component: Servo.Move,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			quickMove: {
				component: Servo.QuickMove,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			moveTo: {
				component: Servo.MoveTo,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			isMoving: {
				component: Servo.IsMoving,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getPosition: {
				component: Servo.GetPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			stop: {
				component: Servo.Stop,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
		},
	},
	[ResourceTriplets.Slam]: {
		widgets: {
			map: {
				component: Slam.Map,
				kind: 'control',
				size: { width: { min: 'xs', max: '4xl' }, height: 'lg' },
			},
			moveOnMap: {
				component: Slam.MoveOnMap,
				kind: 'control',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			getPosition: {
				component: Slam.GetPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'lg' },
			},
			getPointCloudMap: {
				component: Slam.GetPointCloudMap,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getProperties: {
				component: Slam.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getInternalState: {
				component: Slam.GetInternalState,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'md' },
			},
		},
	},
	[ResourceTriplets.Switch]: {
		widgets: {
			setPosition: {
				component: Switch.SetPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getPosition: {
				component: Switch.GetPosition,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'sm' },
			},
			getNumberOfPositions: {
				component: Switch.GetNumberOfPositions,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
		},
	},
	[ResourceTriplets.Vision]: {
		widgets: {
			overlayFeed: {
				component: Vision.OverlayFeed,
				kind: 'control',
				size: { width: { min: 'xs', max: '4xl' }, height: 'lg' },
			},
			captureAllFromCamera: {
				component: Vision.CaptureAllFromCamera,
				kind: 'api',
				size: { width: { min: 'xs', max: '4xl' }, height: 'lg' },
			},
			getProperties: {
				component: Vision.GetProperties,
				kind: 'api',
				size: { width: { min: 'xs', max: 'xs' }, height: 'md' },
			},
			getObjectPointClouds: {
				component: Vision.GetObjectPointClouds,
				kind: 'api',
				size: { width: { min: 'xs', max: '4xl' }, height: 'md' },
			},
			getDetectionsFromCamera: {
				component: Vision.GetDetectionsFromCamera,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'md' },
			},
			getClassificationsFromCamera: {
				component: Vision.GetClassificationsFromCamera,
				kind: 'api',
				size: { width: { min: 'xs', max: '2xl' }, height: 'md' },
			},
			getDetections: {
				component: Vision.GetDetections,
				kind: 'api',
				size: { width: { min: 'xs', max: '4xl' }, height: 'md' },
			},
			getClassifications: {
				component: Vision.GetClassifications,
				kind: 'api',
				size: { width: { min: 'xs', max: '4xl' }, height: 'md' },
			},
		},
	},
} satisfies Partial<Record<ResourceTriplet, ResourceWidgetsEntry>>

const hasEntry = (api: string): api is keyof typeof resourceWidgets =>
	Object.hasOwn(resourceWidgets, api)

/**
 * Returns a resource's entry, or `undefined` for a resource with no widgets.
 *
 * @example
 * widgetsForResource(armResourceName)?.widgets.jog
 * // { component: Arm.Jog, kind: 'control', size: { ... } }
 */
export const widgetsForResource = (resource: ResourceName): ResourceWidgetsEntry | undefined => {
	const api = getResourceAPI(resource)
	return hasEntry(api) ? resourceWidgets[api] : undefined
}
