"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockDDoS = void 0;
const defaultMsg = 'Blocked by proxy. Try again in a moment!';
/**
 * @description Data to store and control the request flow.
 */
class Info {
    constructor(hash, expiresAt, ip) {
        this.hash = hash;
        this.expiresAt = expiresAt;
        this.ip = ip;
    }
    /**
     * @description Get unique hash from request.
     * @param request user Request.
     * @returns hash as string.
     */
    static GetHash(request) {
        const ip = this.GetIP(request);
        const hash = `[${ip}][${request.method}][${request.path}]`;
        return hash;
    }
    /**
     * @description Create an instance of Data from request to store.
     * @param request user Request.
     * @param ttl time to expires in milliseconds.
     * @returns instance of Data as readonly.
     * @default ttl 10000 as milliseconds
     */
    static Create(request, ttl = 10000) {
        const ip = this.GetIP(request);
        const hash = `[${ip}][${request.method}][${request.path}]`;
        const createdAt = Date.now();
        const expiresAt = createdAt + ttl;
        const data = new Info(hash, expiresAt, ip);
        return Object.freeze(data);
    }
    /**
     * @description Get ip from user request.
     * @param request user Request.
     * @returns ip as string.
     */
    static GetIP(request) {
        var _a, _b, _c;
        const ip = (_c = (_b = (_a = request.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress) !== null && _b !== void 0 ? _b : request.headers['x-forwarded-for']) !== null && _c !== void 0 ? _c : request === null || request === void 0 ? void 0 : request.ip;
        return (ip === '::1') ? '127.0.0.1' : ip !== null && ip !== void 0 ? ip : '0.0.0.0';
    }
}
/**
 * @description Local instance in memory to store request info.
 * @summary all data are updated for each 5000 milliseconds or 5 seconds
 */
class MemoryStore {
    constructor() {
        this.Db = [];
        this.interval = 5000;
        this.timer = null;
        this.StartTimerCaseData();
    }
    /**
     * @description Create a singleton instance of MemoryStore.
     * @param interval time in milliseconds to expires data in store.
     * @returns instance of MemoryStore.
     */
    static Create() {
        if (MemoryStore.instance)
            return MemoryStore.instance;
        MemoryStore.instance = new MemoryStore();
        return MemoryStore.instance;
    }
    /**
     * @description Save data to store
     * @param data instance of Data
     * @returns instance of MemoryStore.
     */
    Save(data) {
        this.Db.push(data);
        this.StartTimerCaseData();
        return this;
    }
    /**
     * @description Check if exists data for hash.
     * @param hash string as `[ip][method][path]`
     * @returns true if exist store for hash and returns false if do not exists.
     */
    Exists(hash) {
        const exists = this.GetByHash(hash);
        return !!exists;
    }
    /**
     * @description Get store by hash.
     * @param hash string as `[ip][method][path]`
     * @returns Data as store or null.
     */
    GetByHash(hash) {
        const data = this.Db.find((data) => data.hash === hash);
        if (!data)
            return null;
        return data;
    }
    /**
     * @description Remove expired data from store.
     * @returns instance of MemoryStore.
     */
    RemoveExpired() {
        const now = Date.now();
        this.Db = this.Db.filter((data) => data.expiresAt > now);
        this.StopTimerCaseEmpty();
        return this;
    }
    /**
     * @description Check if exists data in store.
     * @returns true if exist data in store and false if do not.
     */
    HasData() {
        return this.Db.length > 0;
    }
    /**
     * @description Stops Event Loop if do not has data in store.
     * @returns void.
     */
    StopTimerCaseEmpty() {
        if (this.HasData() || !this.timer)
            return;
        clearInterval(this.timer);
        this.timer = null;
    }
    /**
     * @description Event Loop to delete expired register.
     * @returns instance of timer or null.
     * @summary Running as single event and only if exist data.
     */
    StartTimerCaseData() {
        if (!this.HasData() || this.timer)
            return null;
        const timer = setInterval(() => { this.RemoveExpired(); }, this.interval);
        this.timer = timer;
        return timer;
    }
}
/**
 * @description Middleware to block multiple request to a same route for a same ip.
 * @param interval time to expires in milliseconds.
 * @param message error message as string.
 * @returns Middleware function.
 *
 * @default interval `10000` = `10 sec`
 * @default message `Blocked by proxy. Try again in a moment!`
 * @throws if provide interval as not a number
 * @throws if provide interval less than 5000ms or 5 sec
 */
const blockDDoS = (interval = 10000, message = defaultMsg) => {
    if (typeof interval !== 'number')
        throw new Error('The time interval must be a number');
    if (interval < 5000)
        throw new Error('The time interval must be greater than or equal to 5000ms');
    return (req, res, next) => {
        const store = MemoryStore.Create();
        const info = Info.Create(req, interval);
        const hash = Info.GetHash(req);
        const blocked = store.Exists(hash);
        if (blocked)
            return res.status(403).json({ message });
        store.Save(info);
        return next();
    };
};
exports.blockDDoS = blockDDoS;
exports.default = exports.blockDDoS;
