"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const lodash_1 = __importDefault(require("lodash"));
const dc_demostore_integration_1 = require("@amplience/dc-demostore-integration");
const logger_1 = __importStar(require("../common/logger"));
const chalk_1 = __importDefault(require("chalk"));
const { MultiSelect, AutoComplete } = require('enquirer');
exports.command = 'check';
exports.desc = "Check integration content quality";
function average(nums) {
    return Math.floor(nums.reduce((a, b) => (a + b)) / nums.length);
}
const formatPercentage = (a, b) => {
    let percentage = Math.ceil(100.0 * a.length / b.length);
    let colorFn = chalk_1.default.green;
    if (percentage > 66) {
        colorFn = chalk_1.default.red;
    }
    else if (percentage > 33) {
        colorFn = chalk_1.default.yellow;
    }
    return `[ ${colorFn(`${a.length} (${percentage}%)`)} ]`;
};
class Exception {
}
const getRandom = array => array[Math.floor(Math.random() * array.length)];
const builder = (yargs) => yargs.options({
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
});
exports.builder = builder;
const trimString = (str) => {
    return (str === null || str === void 0 ? void 0 : str.substring(0, 4)) + '...';
};
const handler = (context) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`testing integrations: `);
    context.locator.forEach(l => logger_1.default.info(`\t${chalk_1.default.cyan(l)}`));
    let results = yield Promise.all(context.locator.map((locator) => __awaiter(void 0, void 0, void 0, function* () {
        let config = yield (0, dc_demostore_integration_1.getContentItemFromConfigLocator)(locator);
        if (config._meta.schema === 'https://demostore.amplience.com/site/demostoreconfig') {
            config = yield (0, dc_demostore_integration_1.getContentItem)(locator.split(':')[0], config.commerce.id);
        }
        let commerceAPI = yield (0, dc_demostore_integration_1.getCommerceAPI)(config);
        let testResults = yield commerceAPI.testIntegration();
        (0, logger_1.logHeadline)(`test results: ${config._meta.schema}`);
        let megaMenuResult = testResults.find(result => result.operationType === dc_demostore_integration_1.CodecTestOperationType.megaMenu);
        logger_1.default.info(`${chalk_1.default.bold('☯️  get megamenu')}`);
        let megaMenu = megaMenuResult === null || megaMenuResult === void 0 ? void 0 : megaMenuResult.results;
        let second = lodash_1.default.reduce(megaMenu, (sum, n) => { return lodash_1.default.concat(sum, n.children); }, []);
        let third = lodash_1.default.reduce(second, (sum, n) => { return lodash_1.default.concat(sum, n.children); }, []);
        logger_1.default.info(`\tgot [ ${chalk_1.default.green(megaMenu.length)} top level ] [ ${chalk_1.default.green(second.length)} second level ] [ ${chalk_1.default.green(third.length)} third level ] in ${chalk_1.default.greenBright(megaMenuResult === null || megaMenuResult === void 0 ? void 0 : megaMenuResult.duration)}ms\n`);
        if (context.showMegaMenu) {
            console.log(`megaMenu ->`);
            lodash_1.default.each(megaMenu, tlc => {
                console.log(`${tlc.name} (${tlc.slug}) -- [ ${tlc.products.length} ]`);
                lodash_1.default.each(tlc.children, cat => {
                    console.log(`\t${cat.name} (${cat.slug}) -- [ ${cat.products.length} ]`);
                    lodash_1.default.each(cat.children, c => {
                        console.log(`\t\t${c.name} (${c.slug}) -- [ ${c.products.length} ]`);
                    });
                });
            });
        }
        let categoryResults = testResults.filter(result => result.operationType === dc_demostore_integration_1.CodecTestOperationType.getCategory);
        let averageCategoryTime = average(categoryResults.map(cr => cr.duration));
        logger_1.default.info(chalk_1.default.bold(`🧰  get categories`));
        logger_1.default.info(`\tread [ ${chalk_1.default.green(categoryResults.length)} ] categories in an average of ${chalk_1.default.blueBright(averageCategoryTime)}ms\n`);
        let productByProductIdResult = testResults.find(result => result.operationType === dc_demostore_integration_1.CodecTestOperationType.getProductById);
        let productById = productByProductIdResult === null || productByProductIdResult === void 0 ? void 0 : productByProductIdResult.results;
        logger_1.default.info(chalk_1.default.bold(`💰  product by id [ ${chalk_1.default.magenta(trimString(productByProductIdResult === null || productByProductIdResult === void 0 ? void 0 : productByProductIdResult.arguments))} ]`));
        logger_1.default.info(`\tgot [ ${chalk_1.default.green(productById.name)} ] in ${chalk_1.default.blueBright(productByProductIdResult === null || productByProductIdResult === void 0 ? void 0 : productByProductIdResult.duration)}ms\n`);
        let productsByKeywordResult = testResults.find(result => result.operationType === dc_demostore_integration_1.CodecTestOperationType.getProductsByKeyword);
        let productsByKeyword = productsByKeywordResult === null || productsByKeywordResult === void 0 ? void 0 : productsByKeywordResult.results;
        logger_1.default.info(chalk_1.default.bold(`🔍  products by keyword [ ${chalk_1.default.magenta(productsByKeywordResult === null || productsByKeywordResult === void 0 ? void 0 : productsByKeywordResult.arguments)} ]`));
        logger_1.default.info(`\tgot [ ${chalk_1.default.green(productsByKeyword.length)} ] matches in ${chalk_1.default.blueBright(productsByKeywordResult === null || productsByKeywordResult === void 0 ? void 0 : productsByKeywordResult.duration)}ms\n`);
        let productsByProductIdsResult = testResults.find(result => result.operationType === dc_demostore_integration_1.CodecTestOperationType.getProductsByProductIds);
        let productsByProductIds = productsByProductIdsResult === null || productsByProductIdsResult === void 0 ? void 0 : productsByProductIdsResult.results;
        logger_1.default.info(chalk_1.default.bold(`🛍  products by product ids [ ${chalk_1.default.magenta(trimString(productsByProductIdsResult === null || productsByProductIdsResult === void 0 ? void 0 : productsByProductIdsResult.arguments))} ]`));
        logger_1.default.info(`\tgot [ ${chalk_1.default.green(productsByProductIds.length)} ] matches in ${chalk_1.default.blueBright(productsByProductIdsResult === null || productsByProductIdsResult === void 0 ? void 0 : productsByProductIdsResult.duration)}ms\n`);
        let customerGroupsResult = testResults.find(result => result.operationType === dc_demostore_integration_1.CodecTestOperationType.getCustomerGroups);
        let customerGroups = customerGroupsResult === null || customerGroupsResult === void 0 ? void 0 : customerGroupsResult.results;
        logger_1.default.info(chalk_1.default.bold(`🤑  customer groups`));
        logger_1.default.info(`\tgot [ ${chalk_1.default.green(customerGroups.length)} ] groups in ${chalk_1.default.blueBright(customerGroupsResult === null || customerGroupsResult === void 0 ? void 0 : customerGroupsResult.duration)}ms\n`);
        return testResults;
    })));
    if (context.json) {
        console.log(JSON.stringify(results));
    }
    process.exit(0);
});
exports.handler = handler;
