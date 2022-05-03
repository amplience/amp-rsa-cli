"use strict";
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
const dc_demostore_integration_1 = require("@amplience/dc-demostore-integration");
const lodash_1 = __importDefault(require("lodash"));
const cli_table_1 = __importDefault(require("cli-table"));
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../common/logger");
const middleware_1 = require("../common/middleware");
const amplience_builder_1 = __importDefault(require("../common/amplience-builder"));
exports.command = 'show';
exports.desc = "Show environment status";
exports.builder = amplience_builder_1.default;
exports.handler = middleware_1.contextHandler((context) => __awaiter(void 0, void 0, void 0, function* () {
    let repositories = yield dc_demostore_integration_1.paginator(context.hub.related.contentRepositories.list);
    let contentTypeSchemas = yield dc_demostore_integration_1.paginator(context.hub.related.contentTypeSchema.list, { status: 'ACTIVE' });
    let contentTypes = yield dc_demostore_integration_1.paginator(context.hub.related.contentTypes.list, { status: 'ACTIVE' });
    let count = lodash_1.default.zipObject(lodash_1.default.map(repositories, r => r.name || ''), yield Promise.all(repositories.map((repo) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logUpdate(`reading repository ${repo.name}...`);
        let start = new Date().valueOf();
        let x = (yield dc_demostore_integration_1.paginator(repo.related.contentItems.list, { status: 'ACTIVE' })).length;
        logger_1.logUpdate(`repo ${repo.name} read [ ${x} ] content items in ${new Date().valueOf() - start} ms`);
        return x;
    }))));
    logger_1.logUpdate(`reading contentTypes...`);
    count.contentTypes = contentTypes.length;
    logger_1.logUpdate(`reading contentTypeSchemas...`);
    count.contentTypeSchemas = contentTypeSchemas.length;
    logger_1.logUpdate(`reading searchIndexes...`);
    count.searchIndexes = (yield dc_demostore_integration_1.paginator(dc_demostore_integration_1.searchIndexPaginator(context.hub), { status: 'ACTIVE' })).length;
    logger_1.logUpdate(`reading extensions...`);
    count.extensions = (yield dc_demostore_integration_1.paginator(context.hub.related.extensions.list, { status: 'ACTIVE' })).length;
    logger_1.logUpdate(`reading webhooks...`);
    count.webhooks = (yield dc_demostore_integration_1.paginator(context.hub.related.webhooks.list, { status: 'ACTIVE' })).length;
    logger_1.logUpdate(`reading events...`);
    count.events = (yield dc_demostore_integration_1.paginator(context.hub.related.events.list, { status: 'ACTIVE' })).length;
    logger_1.logComplete('');
    let table = new cli_table_1.default();
    lodash_1.default.each(count, (value, key) => {
        table.push({ [chalk_1.default.yellow(key)]: value });
    });
    console.log(table.toString());
    process.exit(0);
}));
