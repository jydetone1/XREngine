import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import LockOutlinedIcon from '@material-ui/icons/LockOutlined'
import { showDialog } from '../../../common/reducers/dialog/service'
import { registerUserByEmail } from '../../reducers/auth/service'
import React, { useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
// @ts-ignore
import styles from './Auth.module.scss'
import { useTranslation } from 'react-i18next'

const mapDispatchToProps = (dispatch: Dispatch): any => ({
  registerUserByEmail: bindActionCreators(registerUserByEmail, dispatch),
  showDialog: bindActionCreators(showDialog, dispatch)
})

interface Props {
  registerUserByEmail: typeof registerUserByEmail
  showDialog: typeof showDialog
}

const SignUp = (props: Props): any => {
  const { registerUserByEmail, showDialog } = props
  const initialState = {
    email: '',
    password: '',
    phone: ''
  }
  const [state, setState] = useState(initialState)
  const { t } = useTranslation()

  const handleInput = (e: any): void => {
    e.preventDefault()
    setState({ ...state, [e.target.name]: e.target.value })
  }

  const handleRegister = (e: any): void => {
    e.preventDefault()
    registerUserByEmail({
      email: state.email,
      password: state.password
    })
  }

  return (
    <Container component="main" maxWidth="xs">
      <div className={styles.paper}>
        <Avatar className={styles.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          {t('user:auth.register.header')}
        </Typography>
        <form className={styles.form} noValidate onSubmit={(e) => handleRegister(e)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="email"
                label={t('user:auth.register.lbl-email')}
                name="email"
                autoComplete="email"
                onChange={(e) => handleInput(e)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                label={t('user:auth.register.lbl-password')}
                type="password"
                id="password"
                autoComplete="current-password"
                onChange={(e) => handleInput(e)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" fullWidth variant="contained" color="primary" className={styles.submit}>
                {t('user:auth.register.lbl-signup')}
              </Button>
            </Grid>
          </Grid>
          {/*<Grid container justify="flex-end">*/}
          {/*<Grid item>*/}
          {/*<Link*/}
          {/*href="#"*/}
          {/*variant="body2"*/}
          {/*onClick={() =>*/}
          {/*showDialog({*/}
          {/*children: <SignIn />*/}
          {/*})*/}
          {/*}*/}
          {/*>*/}
          {/*Already have an account? Sign in*/}
          {/*</Link>*/}
          {/*</Grid>*/}
          {/*</Grid>*/}
        </form>
      </div>
    </Container>
  )
}

const SignUpWrapper = (props: any): any => <SignUp {...props} />

export default connect(null, mapDispatchToProps)(SignUpWrapper)
