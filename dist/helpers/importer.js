"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFileFromDirectory = exports.loadJsonFromDirectory = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const loadJsonFromDirectory = (dir, resourceType) => {
    if (!fs_1.default.existsSync(dir)) {
        return {};
    }
    const files = fs_1.default.readdirSync(dir).map(file => path_1.default.resolve(dir, file))
        .filter(file => fs_1.default.lstatSync(file).isFile() && path_1.default.extname(file) === '.json');
    const loadedFiles = {};
    files.forEach(filename => {
        try {
            loadedFiles[filename] = new resourceType(JSON.parse(fs_1.default.readFileSync(filename, 'utf-8')));
        }
        catch (e) {
            throw new Error(`Non-JSON file found: ${filename}, aborting...`);
        }
    });
    return loadedFiles;
};
exports.loadJsonFromDirectory = loadJsonFromDirectory;
const loadFileFromDirectory = (sourceFile) => {
    return fs_1.default.readFileSync(sourceFile, { encoding: 'utf8' });
};
exports.loadFileFromDirectory = loadFileFromDirectory;
