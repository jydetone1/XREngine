import config from '../../appconfig'

export const userRelationshipTypeSeed = {
  path: 'user-relationship-type',
  randomize: false,
  templates: [
    { type: 'requested' }, // Default state of relatedUser
    { type: 'friend' },
    { type: 'blocking' }, // Blocking another user
    { type: 'blocked' } // Blocked by other user
  ]
}
