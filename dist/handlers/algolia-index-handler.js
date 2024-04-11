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
exports.AlgoliaIndexHandler = void 0;
const resource_handler_1 = require("./resource-handler");
const logger_1 = __importDefault(require("../common/logger"));
class AlgoliaIndexHandler extends resource_handler_1.ResourceHandler {
    constructor() {
        super(undefined, 'algoliaIndexes');
        this.icon = '🔎';
    }
    import(context) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!context.environment.algolia) {
                logger_1.default.info(`skipped, algolia environment not configured`);
                return;
            }
            if (!context.config) {
                context.config = yield context.amplienceHelper.getDemoStoreConfig();
            }
            context.config.algolia = {
                appId: ((_a = context.environment.algolia) === null || _a === void 0 ? void 0 : _a.appId) || '',
                apiKey: ((_b = context.environment.algolia) === null || _b === void 0 ? void 0 : _b.searchKey) || ''
            };
        });
    }
    cleanup(context) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.AlgoliaIndexHandler = AlgoliaIndexHandler;
