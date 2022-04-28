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
const middleware_1 = require("../common/middleware");
const amplience_builder_1 = __importDefault(require("../common/amplience-builder"));
const dc_demostore_integration_1 = require("@amplience/dc-demostore-integration");
const logger_1 = __importStar(require("../common/logger"));
const chalk_1 = __importDefault(require("chalk"));
const async_1 = __importDefault(require("async"));
const { MultiSelect } = require('enquirer');
exports.command = 'check';
exports.desc = "Check integration content quality";
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
const getRandom = array => array[Math.floor(Math.random() * array.length)];
const builder = (yargs) => (0, amplience_builder_1.default)(yargs).options({
    include: {
        alias: 'i',
        describe: 'types to include',
        type: 'array'
    },
    all: {
        alias: 'a',
        describe: 'check all integration types',
        type: 'boolean'
    },
    showMegaMenu: {
        alias: 'm',
        describe: 'show the mega menu structure',
        type: 'boolean'
    }
});
exports.builder = builder;
const Operation = operation => {
    const start = new Date().valueOf();
    return {
        do: (status) => __awaiter(void 0, void 0, void 0, function* () {
            let result = yield operation.execute();
            return Object.assign(Object.assign({}, operation), { result, duration: `${new Date().valueOf() - start}ms`, status: status(result) });
        })
    };
};
exports.handler = (0, middleware_1.contextHandler)((context) => __awaiter(void 0, void 0, void 0, function* () {
    let { hub, showMegaMenu } = context;
    let siteStructureContentItems = yield (0, dc_demostore_integration_1.paginator)(hub.repositories['sitestructure'].related.contentItems.list, { status: 'ACTIVE' });
    let integrationItems = siteStructureContentItems.filter(ci => ci.body._meta.schema.indexOf('/site/integration') > -1);
    let choices = context.all ? integrationItems.map(i => i.body._meta.schema.split('/').pop()) : context.include;
    if (lodash_1.default.isEmpty(choices)) {
        let selected = yield new MultiSelect({
            message: 'select integrations to test',
            choices: integrationItems.map(i => ({ name: i.body._meta.name, value: i.body._meta.schema.split('/').pop() })),
            result(names) { return this.map(names); }
        }).run();
        choices = Object.values(selected);
    }
    yield async_1.default.eachSeries(choices, (choice, callback) => __awaiter(void 0, void 0, void 0, function* () {
        let integrationItems = siteStructureContentItems.filter(ci => ci.body._meta.schema.indexOf(`/site/integration/${choice}`) > -1);
        if (lodash_1.default.isEmpty(integrationItems)) {
            callback(new Error(`couldn't find integration for [ ${choice} ]`));
        }
        yield async_1.default.eachSeries(integrationItems, (item, cb) => __awaiter(void 0, void 0, void 0, function* () {
            item.body._meta = Object.assign(Object.assign({}, item.body._meta), { deliveryId: item.deliveryId });
            try {
                let commerceAPI = yield (0, dc_demostore_integration_1.getCodec)((0, dc_demostore_integration_1.CryptKeeper)(item.body, hub.name).decryptAll());
                let allProducts = [];
                let megaMenu = [];
                let categories = [];
                let megaMenuOperation = yield Operation({
                    tag: '☯️  get megamenu',
                    execute: () => __awaiter(void 0, void 0, void 0, function* () { return yield commerceAPI.getMegaMenu({}); })
                }).do((mm) => {
                    megaMenu = mm;
                    let second = lodash_1.default.reduce(megaMenu, (sum, n) => { return lodash_1.default.concat(sum, n.children); }, []);
                    let third = lodash_1.default.reduce(lodash_1.default.flatMap(megaMenu, 'children'), (sum, n) => { return lodash_1.default.concat(sum, n.children); }, []);
                    categories = lodash_1.default.concat(megaMenu, second, third);
                    return `[ ${chalk_1.default.green(megaMenu.length)} top level ] [ ${chalk_1.default.green(second.length)} second level ] [ ${chalk_1.default.green(third.length)} third level ]`;
                });
                let flattenedCategories = (0, dc_demostore_integration_1.flattenCategories)(categories);
                let categoryOperation = yield Operation({
                    tag: '🧰  get category',
                    execute: () => __awaiter(void 0, void 0, void 0, function* () { return yield commerceAPI.getCategory(flattenedCategories[0]); })
                }).do((cat) => {
                    return ` has ${chalk_1.default.green(cat.products.length)} products`;
                });
                const categoryReadStart = new Date().valueOf();
                let categoryCount = 0;
                yield Promise.all(flattenedCategories.map((cat) => __awaiter(void 0, void 0, void 0, function* () {
                    let category = yield commerceAPI.getCategory(cat);
                    cat.products = category.products;
                    allProducts = lodash_1.default.concat(allProducts, cat.products);
                    categoryCount++;
                    (0, logger_1.logUpdate)(`🧰  got [ ${categoryCount}/${flattenedCategories.length} ] categories and ${chalk_1.default.yellow(allProducts.length)} products`);
                })));
                (0, logger_1.logComplete)(`🧰  read ${chalk_1.default.green(flattenedCategories.length)} categories, ${chalk_1.default.yellow(allProducts.length)} products in ${chalk_1.default.cyan(`${new Date().valueOf() - categoryReadStart} ms`)}`);
                let randomProduct = getRandom(allProducts);
                let randomProduct2 = getRandom(allProducts);
                let productOperation = yield Operation({
                    tag: `💰  get product`,
                    execute: () => __awaiter(void 0, void 0, void 0, function* () { return yield commerceAPI.getProduct(randomProduct); })
                }).do((product) => {
                    return `found product [ ${chalk_1.default.yellow(product.name)} : ${chalk_1.default.green(product.variants[0].listPrice)} ]`;
                });
                let productIds = [randomProduct, randomProduct2].map(i => i.id);
                let productsOperation = yield Operation({
                    tag: '💎  get products',
                    execute: () => __awaiter(void 0, void 0, void 0, function* () { return yield commerceAPI.getProducts({ productIds: productIds.join(',') }); })
                }).do((products) => {
                    return `got [ ${chalk_1.default.green(products.length)} ] products for [ ${chalk_1.default.gray(productIds.length)} ] productIds`;
                });
                let customerGroupOperation = yield Operation({
                    tag: `👨‍👩‍👧‍👦  get customer groups`,
                    execute: () => __awaiter(void 0, void 0, void 0, function* () { return yield commerceAPI.getCustomerGroups({}); })
                }).do((customerGroups) => {
                    return `got [ ${chalk_1.default.green(customerGroups.length)} ]`;
                });
                const logOperation = (operation) => {
                    logger_1.default.info(`[ ${chalk_1.default.blueBright(operation.tag)} ] [ ${chalk_1.default.cyan(operation.duration)} ] ${operation.status}`);
                };
                logOperation(megaMenuOperation);
                logOperation(categoryOperation);
                logOperation(productOperation);
                logOperation(productsOperation);
                logOperation(customerGroupOperation);
                let noProductCategories = lodash_1.default.filter(flattenedCategories, cat => cat.products.length === 0);
                logger_1.default.info(`${formatPercentage(noProductCategories, flattenedCategories)} categories with no products`);
                let noImageProducts = lodash_1.default.filter(allProducts, prod => lodash_1.default.isEmpty(lodash_1.default.flatten(lodash_1.default.map(prod.variants, 'images'))));
                logger_1.default.info(`${formatPercentage(noImageProducts, allProducts)} products with no image`);
                let noPriceProducts = lodash_1.default.filter(allProducts, prod => prod.variants[0].listPrice === '--');
                logger_1.default.info(`${formatPercentage(noPriceProducts, allProducts)} products with no price`);
            }
            catch (error) {
                logger_1.default.error(`testing integration for [ ${item.body._meta.schema} ]: ${chalk_1.default.red('failed')}: ${error}`);
                console.log(error.stack);
            }
            cb();
        }));
        callback();
    }));
}));
