import { CleanupContext, ImportContext, ResourceHandler } from "./resource-handler";
import logger from "../common/logger"

export class AlgoliaIndexHandler extends ResourceHandler {
    icon = '🔎';

    constructor() {
        super(undefined, 'algoliaIndexes')
    }

    async import(context: ImportContext): Promise<any> {
        if (!context.environment.algolia) {
            logger.info(`skipped, algolia environment not configured`)
            return
        }

        if(!context.config) {
            context.config = await context.amplienceHelper.getDemoStoreConfig();
        }
        context.config.algolia = {
            appId: context.environment.algolia?.appId || '',
            apiKey: context.environment.algolia?.searchKey || ''
        }
    }

    async cleanup(context: CleanupContext): Promise<any> {
        // noop
    }
}