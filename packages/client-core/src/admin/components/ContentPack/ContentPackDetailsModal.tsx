import Backdrop from '@material-ui/core/Backdrop'
import Button from '@material-ui/core/Button'
import Fade from '@material-ui/core/Fade'
import Modal from '@material-ui/core/Modal'
import classNames from 'classnames'
import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { selectAdminState } from '../../reducers/admin/selector'
import { selectAppState } from '../../../common/reducers/app/selector'
import { selectAuthState } from '../../../user/reducers/auth/selector'
// @ts-ignore
import styles from './ContentPack.module.scss'
import { downloadContentPack } from '../../reducers/contentPack/service'
import { Done } from '@material-ui/icons'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import CircularProgress from '@material-ui/core/CircularProgress'

interface Props {
  contentPack: any
  open: boolean
  handleClose: any
  adminState?: any
  uploadAvatar?: any
  downloadContentPack?: any
}

const mapStateToProps = (state: any): any => {
  return {
    appState: selectAppState(state),
    authState: selectAuthState(state),
    adminState: selectAdminState(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch): any => ({
  downloadContentPack: bindActionCreators(downloadContentPack, dispatch)
})

const ContentPackDetailsModal = (props: Props): any => {
  const { contentPack, open, handleClose, downloadContentPack } = props

  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const showError = (err: string) => {
    setError(err)
    setTimeout(() => {
      setError('')
    }, 3000)
  }

  const showSuccess = () => {
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
    }, 3000)
  }

  const getContentPack = async () => {
    try {
      setProcessing(true)
      await downloadContentPack(contentPack.url)
      setProcessing(false)
      showSuccess()
    } catch (err) {
      setProcessing(false)
      showError('Invalid URL')
    }
  }

  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className={styles.modal}
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500
        }}
      >
        <Fade in={props.open}>
          <div
            className={classNames({
              [styles.paper]: true,
              [styles['modal-content']]: true
            })}
          >
            <div className={styles['modal-header']}>
              <Button
                type="button"
                variant="contained"
                color="primary"
                className={styles['details-download-button']}
                onClick={getContentPack}
              >
                Download
              </Button>
              <div className={styles['title']}>
                {contentPack.name} (v{contentPack.data?.version})
              </div>
              <IconButton aria-label="close" className={styles.closeButton} onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </div>

            <div className={styles['body']}>
              <div className={styles['avatars-container']}>
                <div className={styles['header']}>Avatars</div>
                <div className={styles['container']}>
                  {contentPack.data?.avatars?.map((avatar) => {
                    return (
                      <div key={avatar.name} className={styles['avatar']}>
                        <div className={styles['name']}>{avatar.name} </div>
                        <img src={avatar.thumbnail} />
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className={styles['scenes-container']}>
                <div className={styles['header']}>Scenes</div>
                <div className={styles['container']}>
                  {contentPack.data?.scenes?.map((scene) => {
                    return (
                      <div key={scene.name} className={styles['scene']}>
                        <div className={styles['name']}>{scene.name}</div>
                        {scene.thumbnail && <img src={scene.thumbnail} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            {processing === true && (
              <div className={styles.processing}>
                <CircularProgress color="primary" />
                <div className={styles.text}>Processing</div>
              </div>
            )}
            {success === true && (
              <div className={styles['success']}>
                <Done color="primary" />
                <div>Pack download!</div>
              </div>
            )}
            {error && error.length > 0 && <h2>{error}</h2>}
          </div>
        </Fade>
      </Modal>
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ContentPackDetailsModal)
