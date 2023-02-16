import { Data, fnDDoS, Middleware, NextFunctions, Payload, Requests, Responses } from "./types";

const defaultMsg = 'Blocked by proxy. Try again in a moment!';

/**
 * @description Data to store and control the request flow.
 */
class Info implements Data {

	private constructor (
		public hash: Readonly<string>,
		public expiresAt: Readonly<number>,
		public ip: Readonly<string>
	) { }

	/**
	 * @description Get unique hash from request.
	 * @param request user Request.
	 * @returns hash as string.
	 */
	public static GetHash(request: Requests): string {
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
	public static Create(request: Requests, ttl = 10000): Readonly<Data> {
		const ip = this.GetIP(request);
		const hash = `[${ip}][${request.method}][${request.path}]`;
		const createdAt = Date.now();
		const expiresAt = createdAt + ttl;
		const data = new Info(hash, expiresAt, ip) satisfies Readonly<Data>;
		return Object.freeze(data);
	}

	/**
	 * @description Get ip from user request.
	 * @param request user Request.
	 * @returns ip as string.
	 */
	private static GetIP(request: Requests): string {
		const ip = request.socket?.remoteAddress ?? request.headers['x-forwarded-for'] as string ?? request?.ip;
		return (ip === '::1') ? '127.0.0.1' : ip ?? '0.0.0.0';
	}
}

/**
 * @description Local instance in memory to store request info.
 * @summary all data are updated for each 5000 milliseconds or 5 seconds
 */
class MemoryStore {
	private static instance: MemoryStore;
	private timer: NodeJS.Timer | null;
	private readonly interval: number;
	private Db: Array<Readonly<Data>>;

	private constructor () {
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
	public static Create(): MemoryStore {
		if (MemoryStore.instance) return MemoryStore.instance;
		MemoryStore.instance = new MemoryStore();
		return MemoryStore.instance;
	}

	/**
	 * @description Save data to store
	 * @param data instance of Data
	 * @returns instance of MemoryStore.
	 */
	public Save(data: Readonly<Data>): MemoryStore {
		this.Db.push(data);
		this.StartTimerCaseData();
		return this;
	}

	/**
	 * @description Check if exists data for hash.
	 * @param hash string as `[ip][method][path]`
	 * @returns true if exist store for hash and returns false if do not exists.
	 */
	public Exists(hash: string): boolean {
		const exists = this.GetByHash(hash);
		return !!exists;
	}

	/**
	 * @description Get store by hash.
	 * @param hash string as `[ip][method][path]`
	 * @returns Data as store or null.
	 */
	private GetByHash(hash: string): Readonly<Data> | null {
		const data = this.Db.find((data): boolean => data.hash === hash);
		if (!data) return null;
		return data;
	}

	/**
	 * @description Remove expired data from store.
	 * @returns instance of MemoryStore.
	 */
	private RemoveExpired(): MemoryStore {
		const now = Date.now();
		this.Db = this.Db.filter((data): boolean => data.expiresAt > now);
		this.StopTimerCaseEmpty();
		return this;
	}

	/**
	 * @description Check if exists data in store.
	 * @returns true if exist data in store and false if do not.
	 */
	private HasData(): boolean {
		return this.Db.length > 0;
	}

	/**
	 * @description Stops Event Loop if do not has data in store.
	 * @returns void.
	 */
	private StopTimerCaseEmpty(): void {
		if (this.HasData() || !this.timer) return;
		clearInterval(this.timer);
		this.timer = null;
	}

	/**
	 * @description Event Loop to delete expired register.
	 * @returns instance of timer or null.
	 * @summary Running as single event and only if exist data.
	 */
	private StartTimerCaseData(): NodeJS.Timer | null {
		if (!this.HasData() || this.timer) return null;
		const timer = setInterval((): void => { this.RemoveExpired(); }, this.interval);
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
export const blockDDoS: fnDDoS = (interval = 10000, message = defaultMsg): Middleware => {
	if (typeof interval !== 'number') throw new Error('The time interval must be a number');
	if (interval < 5000) throw new Error('The time interval must be greater than or equal to 5000ms');
	return (req: Requests, res: Responses, next: NextFunctions): Payload => {
		const store = MemoryStore.Create();
		const info = Info.Create(req, interval);
		const hash = Info.GetHash(req);
		const blocked = store.Exists(hash);
		if (blocked) return res.status(403).json({ message });
		store.Save(info);
		return next();
	};
};

export default blockDDoS;