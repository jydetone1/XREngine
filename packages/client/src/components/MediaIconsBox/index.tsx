import React, { useState } from 'react'
import { Mic, MicOff, Videocam, VideocamOff } from '@material-ui/icons'
import FaceIcon from '@material-ui/icons/Face'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectAppOnBoardingStep } from '@xrengine/client-core/src/common/reducers/app/selector'
// @ts-ignore
import styles from './MediaIconsBox.module.scss'
import { MediaStreamSystem } from '@xrengine/engine/src/networking/systems/MediaStreamSystem'
import {
  configureMediaTransports,
  createCamAudioProducer,
  createCamVideoProducer,
  endVideoChat,
  leave,
  pauseProducer,
  resumeProducer
} from '../../transports/SocketWebRTCClientFunctions'
import { selectAuthState } from '@xrengine/client-core/src/user/reducers/auth/selector'
import { selectLocationState } from '@xrengine/client-core/src/social/reducers/location/selector'
import { updateCamAudioState, updateCamVideoState, changeFaceTrackingState } from '../../reducers/mediastream/service'
import {
  startFaceTracking,
  startLipsyncTracking,
  stopFaceTracking,
  stopLipsyncTracking
} from '@xrengine/engine/src/input/behaviors/WebcamInputBehaviors'
import { Network } from '@xrengine/engine/src/networking/classes/Network'
import { VrIcon } from '@xrengine/client-core/src/common/components/Icons/Vricon'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { XRSystem } from '@xrengine/engine/src/xr/systems/XRSystem'

const mapStateToProps = (state: any): any => {
  return {
    onBoardingStep: selectAppOnBoardingStep(state),
    authState: selectAuthState(state),
    locationState: selectLocationState(state),
    mediastream: state.get('mediastream')
  }
}

const mapDispatchToProps = (dispatch): any => ({
  changeFaceTrackingState: bindActionCreators(changeFaceTrackingState, dispatch)
})

const MediaIconsBox = (props) => {
  const { authState, locationState, mediastream, changeFaceTrackingState } = props
  const [xrSupported, setXRSupported] = useState(false)

  const user = authState.get('user')
  const currentLocation = locationState.get('currentLocation').get('location')

  const videoEnabled = currentLocation.locationSettings ? currentLocation.locationSettings.videoEnabled : false
  const instanceMediaChatEnabled = currentLocation.locationSettings
    ? currentLocation.locationSettings.instanceMediaChatEnabled
    : false

  const isFaceTrackingEnabled = mediastream.get('isFaceTrackingEnabled')
  const isCamVideoEnabled = mediastream.get('isCamVideoEnabled')
  const isCamAudioEnabled = mediastream.get('isCamAudioEnabled')

  const onEngineLoaded = () => {
    EngineEvents.instance.once(EngineEvents.EVENTS.JOINED_WORLD, () => setXRSupported(Engine.xrSupported))
    document.removeEventListener('ENGINE_LOADED', onEngineLoaded)
  }
  document.addEventListener('ENGINE_LOADED', onEngineLoaded)

  const checkMediaStream = async (partyId: string): Promise<boolean> => {
    return await configureMediaTransports(partyId)
  }

  const handleFaceClick = async () => {
    const partyId = currentLocation?.locationSettings?.instanceMediaChatEnabled === true ? 'instance' : user.partyId
    if (await checkMediaStream(partyId)) {
      changeFaceTrackingState(!isFaceTrackingEnabled)
      if (!isFaceTrackingEnabled) {
        startFaceTracking()
        startLipsyncTracking()
      } else {
        stopFaceTracking()
        stopLipsyncTracking()
      }
    }
  }

  const checkEndVideoChat = async () => {
    if (
      (MediaStreamSystem.instance.audioPaused || MediaStreamSystem.instance?.camAudioProducer == null) &&
      (MediaStreamSystem.instance.videoPaused || MediaStreamSystem.instance?.camVideoProducer == null)
    ) {
      await endVideoChat({})
      if ((Network.instance.transport as any).channelSocket?.connected === true) await leave(false)
    }
  }
  const handleMicClick = async () => {
    const partyId = currentLocation?.locationSettings?.instanceMediaChatEnabled === true ? 'instance' : user.partyId
    if (await checkMediaStream(partyId)) {
      if (MediaStreamSystem.instance?.camAudioProducer == null) await createCamAudioProducer(partyId)
      else {
        const audioPaused = MediaStreamSystem.instance.toggleAudioPaused()
        if (audioPaused === true) await pauseProducer(MediaStreamSystem.instance?.camAudioProducer)
        else await resumeProducer(MediaStreamSystem.instance?.camAudioProducer)
        checkEndVideoChat()
      }
      updateCamAudioState()
    }
  }

  const handleCamClick = async () => {
    const partyId = currentLocation?.locationSettings?.instanceMediaChatEnabled === true ? 'instance' : user.partyId
    if (await checkMediaStream(partyId)) {
      if (MediaStreamSystem.instance?.camVideoProducer == null) await createCamVideoProducer(partyId)
      else {
        const videoPaused = MediaStreamSystem.instance.toggleVideoPaused()
        if (videoPaused === true) await pauseProducer(MediaStreamSystem.instance?.camVideoProducer)
        else await resumeProducer(MediaStreamSystem.instance?.camVideoProducer)
        checkEndVideoChat()
      }

      updateCamVideoState()
    }
  }

  const handleVRClick = () => EngineEvents.instance.dispatchEvent({ type: XRSystem.EVENTS.XR_START })

  const xrEnabled = Engine.xrSupported === true
  const VideocamIcon = isCamVideoEnabled ? Videocam : VideocamOff
  const MicIcon = isCamAudioEnabled ? Mic : MicOff

  return (
    <section className={styles.drawerBox}>
      {instanceMediaChatEnabled ? (
        <button
          type="button"
          id="UserAudio"
          className={styles.iconContainer + ' ' + (isCamAudioEnabled ? styles.on : '')}
          onClick={handleMicClick}
        >
          <MicIcon />
        </button>
      ) : null}
      {videoEnabled ? (
        <>
          <button
            type="button"
            id="UserVideo"
            className={styles.iconContainer + ' ' + (isCamVideoEnabled ? styles.on : '')}
            onClick={handleCamClick}
          >
            <VideocamIcon />
          </button>
          <button
            type="button"
            id="UserFaceTracking"
            className={styles.iconContainer + ' ' + (isFaceTrackingEnabled ? styles.on : '')}
            onClick={handleFaceClick}
          >
            <FaceIcon />
          </button>
        </>
      ) : null}
      {xrSupported ? (
        <button
          type="button"
          id="UserXR"
          className={styles.iconContainer + ' ' + (!xrEnabled ? '' : styles.on)}
          onClick={handleVRClick}
        >
          <VrIcon />
        </button>
      ) : null}
    </section>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(MediaIconsBox)
