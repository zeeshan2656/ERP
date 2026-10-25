export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (LogLevel = {}));
class Logger {
    format(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaString}`;
    }
    info(message, meta) {
        console.log(this.format(LogLevel.INFO, message, meta));
    }
    warn(message, meta) {
        console.warn(this.format(LogLevel.WARN, message, meta));
    }
    error(message, meta) {
        console.error(this.format(LogLevel.ERROR, message, meta));
    }
    debug(message, meta) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(this.format(LogLevel.DEBUG, message, meta));
        }
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map