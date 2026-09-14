/* eslint-disable array-element-newline */
'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasActiveRecording = exports.handleIncompleteRecording = exports.cleanUpRecordingPlugins = exports.cleanPastRecordings = exports.addRecording = exports.getPastRecordings = exports.stopCurrentRecording = exports.updatePluginState = exports.setCurrentRecording = exports.recordingHistory = void 0;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const electron_store_1 = __importDefault(require("electron-store"));
const execa_1 = __importDefault(require("execa"));
const tempy_1 = __importDefault(require("tempy"));
const manager_1 = require("./windows/manager");
const plugins_1 = require("./plugins");
const timestamped_name_1 = require("./utils/timestamped-name");
const video_1 = require("./video");
const sentry_1 = __importStar(require("./utils/sentry"));
const ffmpeg_path_1 = __importDefault(require("./utils/ffmpeg-path"));
exports.recordingHistory = new electron_store_1.default({
    name: 'recording-history',
    schema: {
        activeRecording: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string'
                },
                name: {
                    type: 'string'
                },
                date: {
                    type: 'string'
                },
                apertureOptions: {
                    type: 'object'
                },
                plugins: {
                    type: 'object'
                }
            }
        },
        recordings: {
            type: 'array',
            default: [],
            items: {
                type: 'object',
                properties: {
                    filePath: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    date: {
                        type: 'string'
                    }
                }
            }
        }
    }
});
const setCurrentRecording = ({ filePath, name = (0, timestamped_name_1.generateTimestampedName)(), date = new Date().toISOString(), apertureOptions, plugins = {} }) => {
    exports.recordingHistory.set('activeRecording', {
        filePath,
        name,
        date,
        apertureOptions,
        plugins
    });
};
exports.setCurrentRecording = setCurrentRecording;
const updatePluginState = (state) => {
    exports.recordingHistory.set('activeRecording.plugins', state);
};
exports.updatePluginState = updatePluginState;
const stopCurrentRecording = (recordingName) => {
    const { filePath, name } = exports.recordingHistory.get('activeRecording');
    (0, exports.addRecording)({
        filePath,
        name: recordingName !== null && recordingName !== void 0 ? recordingName : name,
        date: new Date().toISOString()
    });
    exports.recordingHistory.delete('activeRecording');
};
exports.stopCurrentRecording = stopCurrentRecording;
const getPastRecordings = () => {
    const recordings = exports.recordingHistory.get('recordings', []);
    const validRecordings = recordings.filter(({ filePath }) => fs_1.default.existsSync(filePath));
    exports.recordingHistory.set('recordings', validRecordings);
    return validRecordings;
};
exports.getPastRecordings = getPastRecordings;
const addRecording = (newRecording) => {
    const recordings = [newRecording, ...exports.recordingHistory.get('recordings', [])];
    const validRecordings = recordings.filter(({ filePath }) => fs_1.default.existsSync(filePath));
    exports.recordingHistory.set('recordings', validRecordings);
    return validRecordings;
};
exports.addRecording = addRecording;
const cleanPastRecordings = () => {
    const recordings = (0, exports.getPastRecordings)();
    for (const recording of recordings) {
        fs_1.default.unlinkSync(recording.filePath);
    }
    exports.recordingHistory.set('recordings', []);
};
exports.cleanPastRecordings = cleanPastRecordings;
const cleanUpRecordingPlugins = (usedPlugins) => {
    const recordingPlugins = plugins_1.plugins.recordingPlugins;
    for (const pluginName of Object.keys(usedPlugins)) {
        const plugin = recordingPlugins.find(p => p.name === pluginName);
        for (const [serviceTitle, persistedState] of Object.entries(usedPlugins[pluginName])) {
            const service = plugin === null || plugin === void 0 ? void 0 : plugin.recordServices.find(s => s.title === serviceTitle);
            if (service === null || service === void 0 ? void 0 : service.cleanUp) {
                service.cleanUp(persistedState);
            }
        }
    }
};
exports.cleanUpRecordingPlugins = cleanUpRecordingPlugins;
const handleIncompleteRecording = async (recording) => {
    (0, exports.cleanUpRecordingPlugins)(recording.plugins);
    try {
        await (0, execa_1.default)(ffmpeg_path_1.default, [
            '-i', recording.filePath,
            // Verbosity level
            '-v', 'error',
            // Force file type to null (we don't want to actually generate a file)
            // https://trac.ffmpeg.org/wiki/Null
            '-f', 'null', '-'
        ]);
    }
    catch (error) {
        return handleCorruptRecording(recording, error.stderr);
    }
    return handleRecording(recording);
};
exports.handleIncompleteRecording = handleIncompleteRecording;
const handleRecording = async (recording) => {
    var _a;
    (0, exports.addRecording)({
        filePath: recording.filePath,
        name: recording.name,
        date: recording.date
    });
    return (_a = manager_1.windowManager.dialog) === null || _a === void 0 ? void 0 : _a.open({
        title: 'Kap didn\'t shut down correctly.',
        detail: 'Looks like Kap crashed during a recording. Kap was able to locate the file and it appears to be playable.',
        buttons: [
            'Close',
            {
                label: 'Show in Finder',
                action: () => {
                    electron_1.shell.showItemInFolder(recording.filePath);
                }
            },
            {
                label: 'Show in Editor',
                action: async () => video_1.Video.getOrCreate({ filePath: recording.filePath, title: recording.name }).openEditorWindow()
            }
        ]
    });
};
const knownErrors = [{
        test: (error) => error.includes('moov atom not found'),
        fix: async (filePath) => {
            try {
                const outputPath = tempy_1.default.file({ extension: 'mp4' });
                await (0, execa_1.default)(ffmpeg_path_1.default, [
                    '-i',
                    filePath,
                    // Copy both streams
                    '-vcodec',
                    'copy',
                    '-acodec',
                    'copy',
                    // Attempt to move the moov atom to the start of the file
                    '-movflags',
                    'faststart',
                    outputPath
                ]);
                return outputPath;
            }
            catch { }
        }
    }];
const handleCorruptRecording = async (recording, error) => {
    var _a, _b;
    const options = {
        title: 'Kap didn\'t shut down correctly.',
        detail: `Looks like Kap crashed during a recording. We were able to locate the file. Unfortunately, it appears to be corrupt.\n\n${error}`,
        cancelId: 0,
        defaultId: 2,
        buttons: [
            'Close',
            {
                label: 'Copy Error',
                action: () => {
                    electron_1.clipboard.writeText(error);
                }
            },
            {
                label: 'Show in Finder',
                action: () => {
                    electron_1.shell.showItemInFolder(recording.filePath);
                }
            }
        ]
    };
    const applicableErrors = knownErrors.filter(({ test }) => test(error));
    if (applicableErrors.length === 0) {
        if (sentry_1.isSentryEnabled) {
            // Collect info about possible unknown errors, to see if we can implement fixes using ffmpeg
            sentry_1.default.captureException(new Error(`Corrupt recording: ${error}`));
        }
        return (_a = manager_1.windowManager.dialog) === null || _a === void 0 ? void 0 : _a.open(options);
    }
    options.message = 'We can attempt to repair the recording.';
    options.defaultId = 3;
    options.buttons.push({
        label: 'Attempt to Fix',
        activeLabel: 'Attempting to Fix…',
        action: async (_, updateUi) => {
            for (const { fix } of applicableErrors) {
                const outputPath = await fix(recording.filePath);
                if (outputPath) {
                    (0, exports.addRecording)({
                        filePath: outputPath,
                        name: recording.name,
                        date: new Date().toISOString()
                    });
                    return updateUi({
                        message: 'The recording was successfully repaired.',
                        defaultId: 2,
                        buttons: [
                            'Close',
                            {
                                label: 'Show in Finder',
                                action: () => {
                                    electron_1.shell.showItemInFolder(outputPath);
                                }
                            },
                            {
                                label: 'Show in Editor',
                                action: async () => video_1.Video.getOrCreate({ filePath: outputPath, title: recording.name }).openEditorWindow()
                            }
                        ]
                    });
                }
            }
            return updateUi({
                message: 'Kap was unable to repair the recording.',
                defaultId: 2,
                buttons: [
                    'Close',
                    {
                        label: 'Copy Error',
                        action: () => {
                            electron_1.clipboard.writeText(error);
                        }
                    },
                    {
                        label: 'Show in Finder',
                        action: () => {
                            electron_1.shell.showItemInFolder(recording.filePath);
                        }
                    }
                ]
            });
        }
    });
    return (_b = manager_1.windowManager.dialog) === null || _b === void 0 ? void 0 : _b.open(options);
};
const hasActiveRecording = async () => {
    const activeRecording = exports.recordingHistory.get('activeRecording');
    if (activeRecording) {
        await (0, exports.handleIncompleteRecording)(activeRecording);
        exports.recordingHistory.delete('activeRecording');
        return true;
    }
    return false;
};
exports.hasActiveRecording = hasActiveRecording;
//# sourceMappingURL=recording-history.js.map