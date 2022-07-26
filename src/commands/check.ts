import _ from 'lodash'
import { Category, getCommerceAPI, Product, getContentItemFromConfigLocator, getContentItem, CodecTestResult, CodecTestOperationType, Identifiable } from '@amplience/dc-demostore-integration'
import logger, { logHeadline } from '../common/logger';
import chalk from 'chalk';
import { Argv } from 'yargs';
const { MultiSelect, AutoComplete } = require('enquirer');

export const command = 'check';
export const desc = "Check integration content quality";

function average(nums) {
    return Math.floor(nums.reduce((a, b) => (a + b)) / nums.length);
}

const formatPercentage = (a: any[], b: any[]) => {
    let percentage = Math.ceil(100.0 * a.length / b.length)
    let colorFn = chalk.green
    if (percentage > 66) {
        colorFn = chalk.red
    }
    else if (percentage > 33) {
        colorFn = chalk.yellow
    }
    return `[ ${colorFn(`${a.length} (${percentage}%)`)} ]`
}

class Exception {
    exception: string
}

const getRandom = array => array[Math.floor(Math.random() * array.length)]
export const builder = (yargs: Argv): Argv =>
    yargs.options({
        showMegaMenu: {
            alias: 'm',
            describe: 'show the mega menu structure',
            type: 'boolean'
        },
        locator: {
            alias: 'l',
            describe: 'config locator',
            type: 'array',
            required: true
        },
        json: {
            describe: 'render output in json format',
            type: 'boolean'
        }
    })

const trimString = (str?: string): string => {
    return str?.substring(0, 4) + '...'
}

export const handler = async (context: { showMegaMenu: boolean, locator: string[], json: boolean }): Promise<void> => {
    logger.info(`testing integrations: `)
    context.locator.forEach(l => logger.info(`\t${chalk.cyan(l)}`))

    let results = await Promise.all(context.locator.map(async locator => {
        let config = await getContentItemFromConfigLocator(locator)
        if (config._meta.schema === 'https://demostore.amplience.com/site/demostoreconfig') {
            config = await getContentItem(locator.split(':')[0], config.commerce.id)
        }

        let commerceAPI = await getCommerceAPI(config)
        let testResults: CodecTestResult[] = await (commerceAPI as any).testIntegration()

        logHeadline(`test results: ${config._meta.schema}`)

        let megaMenuResult = testResults.find(result => result.operationType === CodecTestOperationType.megaMenu)
        logger.info(`${chalk.bold('☯️  get megamenu')}`)
        let megaMenu: Category[] = megaMenuResult?.results
        let second = _.reduce(megaMenu, (sum, n) => { return _.concat(sum, n.children) }, [])
        let third = _.reduce(second, (sum, n) => { return _.concat(sum, n.children) }, [])
        logger.info(`\tgot [ ${chalk.green(megaMenu.length)} top level ] [ ${chalk.green(second.length)} second level ] [ ${chalk.green(third.length)} third level ] in ${chalk.greenBright(megaMenuResult?.duration)}ms\n`)

        if (context.showMegaMenu) {
            console.log(`megaMenu ->`)
            _.each(megaMenu, tlc => {
                console.log(`${tlc.name} (${tlc.slug}) -- [ ${tlc.products.length} ]`)
                _.each(tlc.children, cat => {
                    console.log(`\t${cat.name} (${cat.slug}) -- [ ${cat.products.length} ]`)
                    _.each(cat.children, c => {
                        console.log(`\t\t${c.name} (${c.slug}) -- [ ${c.products.length} ]`)
                    })
                })
            })
        }

        let categoryResults = testResults.filter(result => result.operationType === CodecTestOperationType.getCategory)
        let averageCategoryTime = average(categoryResults.map(cr => cr.duration))
        logger.info(chalk.bold(`🧰  get categories`))
        logger.info(`\tread [ ${chalk.green(categoryResults.length)} ] categories in an average of ${chalk.blueBright(averageCategoryTime)}ms\n`)

        let productByProductIdResult = testResults.find(result => result.operationType === CodecTestOperationType.getProductById)
        let productById: Product = productByProductIdResult?.results
        logger.info(chalk.bold(`💰  product by id [ ${chalk.magenta(trimString(productByProductIdResult?.arguments))} ]`))
        logger.info(`\tgot [ ${chalk.green(productById.name)} ] in ${chalk.blueBright(productByProductIdResult?.duration)}ms\n`)

        let productsByKeywordResult = testResults.find(result => result.operationType === CodecTestOperationType.getProductsByKeyword)
        let productsByKeyword: Product[] = productsByKeywordResult?.results
        logger.info(chalk.bold(`🔍  products by keyword [ ${chalk.magenta(productsByKeywordResult?.arguments)} ]`))
        logger.info(`\tgot [ ${chalk.green(productsByKeyword.length)} ] matches in ${chalk.blueBright(productsByKeywordResult?.duration)}ms\n`)

        let productsByProductIdsResult = testResults.find(result => result.operationType === CodecTestOperationType.getProductsByProductIds)
        let productsByProductIds: Product[] = productsByProductIdsResult?.results
        logger.info(chalk.bold(`🛍  products by product ids [ ${chalk.magenta(trimString(productsByProductIdsResult?.arguments))} ]`))
        logger.info(`\tgot [ ${chalk.green(productsByProductIds.length)} ] matches in ${chalk.blueBright(productsByProductIdsResult?.duration)}ms\n`)

        let customerGroupsResult = testResults.find(result => result.operationType === CodecTestOperationType.getCustomerGroups)
        let customerGroups: Identifiable[] = customerGroupsResult?.results
        logger.info(chalk.bold(`🤑  customer groups`))
        logger.info(`\tgot [ ${chalk.green(customerGroups.length)} ] groups in ${chalk.blueBright(customerGroupsResult?.duration)}ms\n`)

        return testResults

        //     let noProductCategories = _.filter(flattenedCategories, cat => cat.products?.length === 0)
        //     logger.info(`${formatPercentage(noProductCategories, flattenedCategories)} categories with no products`)

        //     let noImageProducts = _.filter(allProducts, prod => _.isEmpty(_.flatten(_.map(prod.variants, 'images'))))
        //     logger.info(`${formatPercentage(noImageProducts, allProducts)} products with no image`)

        //     let noPriceProducts = _.filter(allProducts, prod => prod.variants[0]?.listPrice === '--')
        //     logger.info(`${formatPercentage(noPriceProducts, allProducts)} products with no price`)
    }))

    if (context.json) {        
        console.log(JSON.stringify(results))
    }
    process.exit(0)
}