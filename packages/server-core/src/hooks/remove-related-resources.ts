import { Hook, HookContext } from '@feathersjs/feathers'
import logger from '../logger'
import StorageProvider from '../media/storageprovider/storageprovider'
import { StaticResource } from '../media/static-resource/static-resource.class'

const getAllChildren = async (
  service: StaticResource,
  id: string | number | undefined,
  $skip: number
): Promise<Record<string, any>[]> => {
  const pageResult = (await service.find({
    query: {
      parentResourceId: id,
      $skip: $skip
    }
  })) as any

  const total = pageResult.total
  let data = pageResult.data
  const limit = pageResult.limit
  if ($skip + (data.length as number) < total) {
    const nextPageData = await getAllChildren(service, id, $skip + (limit as number))

    data = data.concat(nextPageData)

    return data
  } else {
    return data
  }
}

export default (): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const provider = new StorageProvider()

    const { app, params } = context
    if (params.query && params.query.resourceIds) {
      Object.values(params.query.resourceIds).forEach(async (resourceId: string) => {
        const staticResourceService = app.service('static-resource')

        const staticResourceResult = await staticResourceService.find({
          query: {
            id: resourceId
          }
        })
        const staticResource = staticResourceResult.data[0]
        const storageRemovePromise = provider.deleteResources([staticResource.key])
        // // new Promise((resolve, reject) => {
        //   // if (staticResource.url && staticResource.url.length > 0) {
        //     // const key = staticResource.url.replace('https://' +
        //     //   config.aws.cloudfront.domain + '/', '');

        //     // if (storage === undefined) {
        //     //   reject(new Error('Storage is undefined'));
        //     // }

        //     const result = await provider.deleteResources([ staticResource.key ]).catch(err => err);

        //     if (result instanceof Error) {
        //       logger.error('Storage removal error');
        //       logger.error(result);
        //       reject(result);
        //     }

        //     resolve(result);
        // });

        const children = await getAllChildren(staticResourceService as any, resourceId, 0)

        const childRemovalPromises = children.map(async (child: any) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
          return await new Promise(async (resolve, reject) => {
            try {
              await staticResourceService.remove(child.id)
            } catch (err) {
              logger.error('Failed to remove child:', child.id)
              logger.error(err)
              reject(err)
            }

            resolve(true)
          })
        })

        const staticResourceChildrenRemovePromise = Promise.all(childRemovalPromises)

        await Promise.all([storageRemovePromise, staticResourceChildrenRemovePromise])

        await (staticResourceService as any).Model.destroy({
          // Remove static resource itself
          where: {
            id: resourceId
          }
        })
      })
    }

    return context
  }
}
