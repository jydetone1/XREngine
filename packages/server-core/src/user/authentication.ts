import { ServiceAddons } from '@feathersjs/feathers'
import { AuthenticationService } from '@feathersjs/authentication'
import { expressOauth } from '@feathersjs/authentication-oauth'
import { Application } from '../../declarations'
import GithubStrategy from './strategies/github'
import GoogleStrategy from './strategies/google'
import FacebookStrategy from './strategies/facebook'
import LinkedInStrategy from './strategies/linkedin'
import { MyLocalStrategy } from './strategies/local'
import { MyJwtStrategy } from './strategies/jwt'
import TwitterStrategy from './strategies/twitter'

declare module '../../declarations' {
  interface ServiceTypes {
    authentication: AuthenticationService & ServiceAddons<any>
  }
}

export default (app: Application): void => {
  const authentication = new AuthenticationService(app as any)
  authentication.register('jwt', new MyJwtStrategy())
  authentication.register('local', new MyLocalStrategy())
  authentication.register('google', new GoogleStrategy(app))
  authentication.register('facebook', new FacebookStrategy(app))
  authentication.register('github', new GithubStrategy(app))
  authentication.register('linkedin2', new LinkedInStrategy(app))
  authentication.register('twitter', new TwitterStrategy(app))

  app.use('/authentication', authentication)

  app.configure(expressOauth())
}
