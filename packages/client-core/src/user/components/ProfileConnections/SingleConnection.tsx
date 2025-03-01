import Avatar from '@material-ui/core/Avatar'
import Box from '@material-ui/core/Box'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { IdentityProviderSeed } from '@xrengine/common/src/interfaces/IdentityProvider'
import { User } from '@xrengine/common/src/interfaces/User'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { showAlert } from '../../../common/reducers/alert/actions'
import { showDialog } from '../../../common/reducers/dialog/service'
import MagicLinkEmail from '../../../user/components/Auth/MagicLinkEmail'
import PasswordLogin from '../../../user/components/Auth/PasswordLogin'
import { selectAuthState } from '../../reducers/auth/selector'
import {
  addConnectionByOauth,
  addConnectionByPassword,
  createMagicLink,
  loginUserByPassword,
  removeConnection
} from '../../reducers/auth/service'
import { ConnectionTexts } from './ConnectionTexts'
import { useTranslation } from 'react-i18next'
// @ts-ignore
import styles from './ProfileConnections.module.scss'

interface Props {
  auth?: any
  classes?: any
  connectionType?: 'facebook' | 'github' | 'google' | 'email' | 'sms' | 'password' | 'linkedin'

  showDialog?: typeof showDialog
  addConnectionByOauth?: typeof addConnectionByOauth
  createMagicLink?: typeof createMagicLink
  loginUserByPassword?: typeof loginUserByPassword
  addConnectionByPassword?: typeof addConnectionByPassword
  removeConnection?: typeof removeConnection
  showAlert?: typeof showAlert
}

const mapStateToProps = (state: any): any => {
  return {
    auth: selectAuthState(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch): any => ({
  showDialog: bindActionCreators(showDialog, dispatch),
  addConnectionByOauth: bindActionCreators(addConnectionByOauth, dispatch),
  createMagicLink: bindActionCreators(createMagicLink, dispatch),
  loginUserByPassword: bindActionCreators(loginUserByPassword, dispatch),
  addConnectionByPassword: bindActionCreators(addConnectionByPassword, dispatch),
  removeConnection: bindActionCreators(removeConnection, dispatch),
  showAlert: bindActionCreators(showAlert, dispatch)
})

const SingleConnection = (props: Props): any => {
  const { addConnectionByOauth, auth, classes, connectionType, removeConnection, showAlert, showDialog } = props
  const { t } = useTranslation()

  const initialState = {
    identityProvider: IdentityProviderSeed,
    userId: ''
  }
  const [state, setState] = useState(initialState)

  useEffect(() => {
    const user = auth.get('user') as User
    if (!user) {
      return
    }

    setState({
      ...state,
      identityProvider: user.identityProviders.find((v) => v.type === connectionType)
    })
  }, [])

  const disconnect = (): any => {
    const identityProvider = state.identityProvider
    const authIdentityProvider = props.auth.get('authUser').identityProvider
    if (authIdentityProvider.id === identityProvider.id) {
      showAlert('error', t('user:profile.connections.ipError'))
      return
    }

    removeConnection(identityProvider.id, state.userId)
  }

  const connect = (): any => {
    const { userId } = state

    switch (connectionType) {
      case 'facebook':
      case 'google':
      case 'github':
        addConnectionByOauth(connectionType, userId)
        break
      case 'email':
        showDialog({
          children: <MagicLinkEmail type="email" isAddConnection={true} />
        })
        break
      case 'sms':
        showDialog({
          children: <MagicLinkEmail type="sms" isAddConnection={true} />
        })
        break
      case 'password':
        showDialog({
          children: <PasswordLogin isAddConnection={true} />
        })
        break
      case 'linkedin':
        addConnectionByOauth(connectionType, userId)
        break
    }
  }

  const identityProvider = state.identityProvider
  let texts
  let actionBlock
  if (identityProvider?.id) {
    texts = ConnectionTexts[connectionType].connected

    actionBlock = (
      <Box display="flex">
        <Box p={1}>
          <a href="#" onClick={disconnect} className={styles.button}>
            <Typography variant="h6">{identityProvider.token}</Typography>
            <Typography color="textSecondary" variant="body2">
              ({t('user:profile.connections.disconnect')})
            </Typography>
          </a>
        </Box>
        <Box p={1}>
          <Avatar variant="rounded" src="" alt="avatar" />
        </Box>
      </Box>
    )
  } else {
    texts = ConnectionTexts[connectionType].notConnected

    actionBlock = (
      <Box display="flex">
        <Box p={1}>
          <a href="#" onClick={connect} className={styles.button}>
            {t('user:profile.connections.connect')}
          </a>
        </Box>
      </Box>
    )
  }

  return (
    <div className={styles.root}>
      <Box display="flex" p={1}>
        <Box p={1} flexGrow={1}>
          <Grid container direction="column">
            <Typography gutterBottom variant="h5">
              {texts.header}
            </Typography>

            {texts.descr.map((descr, index) => {
              return (
                <Typography key={index} color="textSecondary" variant="body2">
                  {descr}
                </Typography>
              )
            })}
          </Grid>
        </Box>

        {actionBlock}
      </Box>
    </div>
  )
}

const SingleConnectionWrapper = (props: Props): any => <SingleConnection {...props} />

export default connect(mapStateToProps, mapDispatchToProps)(SingleConnectionWrapper)
