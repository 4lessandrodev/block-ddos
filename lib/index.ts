import { Data, fnDDoS, Middleware, NextFunctions, Params, Payload, Requests, Responses } from "./types";

const defaultMsg = 'Blocked by proxy. Try again in a moment!';

/**
 * @description Data to store and control the request flow.
 */
class Info implements Data {

	private constructor (
		public hash: Readonly<string>,
		public expiresAt: Readonly<number>,
		public attempts: Readonly<number>,
		public ttl: Readonly<number>,
	) { 
		Object.freeze(this);
	}

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
	 * @description Create a new instance with incremented attempts.
	 * @returns instance of Data.
	 */
	public Increment(): Readonly<Data> {
		const attempts = this.attempts + 1;
		const expiresAt = Date.now() + this.ttl;
		return new Info(this.hash, expiresAt, attempts, this.ttl) satisfies Readonly<Data>;
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
		const attempts = 1;
		return new Info(hash, expiresAt, attempts, ttl) satisfies Readonly<Data>;
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
	private attempts: number;

	private constructor (attempts: number) {
		this.Db = [];
		this.interval = 5000;
		this.attempts = attempts;
		this.timer = null;
		this.StartTimerCaseData();
	}

	/**
	 * @description Create a singleton instance of MemoryStore.
	 * @param interval time in milliseconds to expires data in store.
	 * @returns instance of MemoryStore.
	 */
	public static Create(attempts = 3): MemoryStore {
		if (MemoryStore.instance) return MemoryStore.instance;
		MemoryStore.instance = new MemoryStore(attempts);
		return MemoryStore.instance;
	}

	/**
	 * @description Save data to store
	 * @param data instance of Data
	 * @returns instance of MemoryStore.
	 */
	public Save(data: Readonly<Data>): MemoryStore {
		const alreadyExists = this.Exists(data.hash);
		if(alreadyExists){
			this.Increment(data);
			this.StartTimerCaseData();
			return this;
		}
		this.Db.push(data);
		this.StartTimerCaseData();
		return this;
	}

	/**
	 * @description Check if exists data for hash.
	 * @param hash string as `[ip][method][path]`
	 * @returns true if exist store for hash and returns false if do not exists.
	 */
	private Exists(hash: string): boolean {
		const exists = this.GetByHash(hash);
		return !!exists;
	}

	/**
	 * @description 
	 * @param data 
	 */
	private Increment(data: Readonly<Data>): void {
		const res = data.Increment();
		this.Db = this.Db.filter((dt): boolean => dt.hash !== data.hash);
		this.Db.push(res);
	}

	/**
	 * @description Check total attempts to a route.
	 * @param data instance of Data.
	 * @returns true if has the limit attempts and return false if do not.
	 */
	private HasMaxAttempts(data: Readonly<Data>): boolean {
		return this.attempts <= data.attempts;
	}

	/**
	 * @description Check if can user can access the route.
	 * @param hash string as `[ip][method][path]`
	 * @returns true if user can access the route and returns false if user do not.
	 */
	public CanAccess(hash: string): boolean {
		const exists = this.GetByHash(hash);
		if(!exists) return true;
		const hasMaxAttempts = this.HasMaxAttempts(exists);		
		if(hasMaxAttempts) return false;
		return true;
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
export const blockDDoS: fnDDoS = (params?: Params): Middleware => {
	if (params && params?.attempts && typeof params.attempts !== 'number') throw new Error('The attempts param must be a positive number');
	if (params && params?.interval && typeof params.interval !== 'number') throw new Error('The time interval must be a number');
	if (params && params?.interval && params.interval < 5000) throw new Error('The time interval must be greater than or equal to 5000ms');
	return (req: Requests, res: Responses, next: NextFunctions): Payload => {
		const store = MemoryStore.Create(params?.attempts);
		const info = Info.Create(req, params?.interval);
		const hash = Info.GetHash(req);
		const canAccess = store.CanAccess(hash);
		if (!canAccess) return res.status(403).json({ error: params?.error ?? { message: defaultMsg } });
		store.Save(info);
		return next();
	};
};

export default blockDDoS;