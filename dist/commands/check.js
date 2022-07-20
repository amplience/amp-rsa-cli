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
const handler = (context) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`testing integrations: `);
    context.locator.forEach(l => logger_1.default.info(`\t${chalk_1.default.cyan(l)}`));
    yield Promise.all(context.locator.map((locator) => __awaiter(void 0, void 0, void 0, function* () {
        let config = yield (0, dc_demostore_integration_1.getContentItemFromConfigLocator)(locator);
        if (config._meta.schema === 'https://demostore.amplience.com/site/demostoreconfig') {
            config = yield (0, dc_demostore_integration_1.getContentItem)(locator.split(':')[0], config.commerce.id);
        }
        let commerceAPI = yield (0, dc_demostore_integration_1.getCommerceAPI)(config);
        let allProducts = [];
        let megaMenu = [];
        let categories = [];
        let megaMenuOperation = yield Operation({
            tag: '☯️  get megamenu',
            execute: () => __awaiter(void 0, void 0, void 0, function* () { return yield commerceAPI.getMegaMenu({}); })
        }).do((mm) => {
            megaMenu = mm;
            let second = lodash_1.default.reduce(megaMenu, (sum, n) => { return lodash_1.default.concat(sum, n.children); }, []);
            let third = lodash_1.default.reduce(second, (sum, n) => { return lodash_1.default.concat(sum, n.children); }, []);
            categories = lodash_1.default.concat(megaMenu, second, third);
            return `[ ${chalk_1.default.green(megaMenu.length)} top level ] [ ${chalk_1.default.green(second.length)} second level ] [ ${chalk_1.default.green(third.length)} third level ]`;
        });
        let flattenedCategories = lodash_1.default.uniqBy((0, dc_demostore_integration_1.flattenCategories)(categories), 'id');
        let categoryOperation = yield Operation({
            tag: '🧰  get category',
            execute: () => __awaiter(void 0, void 0, void 0, function* () { return yield commerceAPI.getCategory(flattenedCategories[0]); })
        }).do((cat) => {
            return ` has ${chalk_1.default.green(cat.products.length)} products`;
        });
        const categoryReadStart = new Date().valueOf();
        let categoryCount = 0;
        const loadCategory = (cat) => __awaiter(void 0, void 0, void 0, function* () {
            let category = yield commerceAPI.getCategory(cat);
            if (category) {
                cat.products = category.products;
                allProducts = lodash_1.default.concat(allProducts, cat.products);
                categoryCount++;
            }
        });
        yield Promise.all(flattenedCategories.map(loadCategory));
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
        allProducts = lodash_1.default.uniqBy(allProducts, 'id');
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
            if ('exception' in customerGroups) {
                return `exception [ ${chalk_1.default.red(customerGroups.exception)} ]`;
            }
            else {
                return `got [ ${chalk_1.default.green(customerGroups.length)} ]`;
            }
        });
        const logOperation = (operation) => {
            logger_1.default.info(`[ ${chalk_1.default.blueBright(operation.tag)} ] [ ${chalk_1.default.cyan(operation.duration)} ] ${operation.status}`);
        };
        (0, logger_1.logHeadline)(`test results: ${config._meta.schema}`);
        (0, logger_1.logComplete)(`🧰  read ${chalk_1.default.green(categories.length)} categories, ${chalk_1.default.yellow(allProducts.length)} products in ${chalk_1.default.cyan(`${new Date().valueOf() - categoryReadStart} ms`)}`);
        logOperation(megaMenuOperation);
        logOperation(categoryOperation);
        logOperation(productOperation);
        logOperation(productsOperation);
        logOperation(customerGroupOperation);
        let noProductCategories = lodash_1.default.filter(flattenedCategories, cat => { var _a; return ((_a = cat.products) === null || _a === void 0 ? void 0 : _a.length) === 0; });
        logger_1.default.info(`${formatPercentage(noProductCategories, flattenedCategories)} categories with no products`);
        let noImageProducts = lodash_1.default.filter(allProducts, prod => lodash_1.default.isEmpty(lodash_1.default.flatten(lodash_1.default.map(prod.variants, 'images'))));
        logger_1.default.info(`${formatPercentage(noImageProducts, allProducts)} products with no image`);
        let noPriceProducts = lodash_1.default.filter(allProducts, prod => { var _a; return ((_a = prod.variants[0]) === null || _a === void 0 ? void 0 : _a.listPrice) === '--'; });
        logger_1.default.info(`${formatPercentage(noPriceProducts, allProducts)} products with no price`);
    })));
    process.exit(0);
});
exports.handler = handler;
