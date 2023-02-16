import { NextFunction, Request, Response } from "express";

interface Data {
	hash: string;
	expiresAt: number;
	ip: string;
}

type Payload = Response extends {} ? Response<any, Record<string, any>> | void : any;
type Middleware = (req: Requests, res: Responses, next: NextFunctions) => Payload;
type Requests = Request extends {} ? Request : any;
type Responses = Response extends {} ? Response : any;
type NextFunctions = NextFunction extends {} ? NextFunction : any;

const defaultMsg = 'Blocked by proxy. Try again in a moment!';

/**
 * @description Data to store and control the request flow.
 */
class Info implements Data {

	private constructor (
		public hash: Readonly<string>,
		public expiresAt: Readonly<number>,
		public createdAt: Readonly<number>,
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
	 */
	public static Create(request: Requests, ttl = 30000): Readonly<Data> {
		const ip = this.GetIP(request);
		const hash = `[${ip}][${request.method}][${request.path}]`;
		const createdAt = Date.now();
		const expiresAt = createdAt + ttl;
		const data = { expiresAt, hash, ip } satisfies Readonly<Data>;
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
 */
class MemoryStore {
	private static instance: MemoryStore;
	private timer: NodeJS.Timer | null;
	private readonly interval: number;
	private Db: Array<Readonly<Data>>;

	private constructor (interval: number) {
		this.Db = [];
		this.interval = interval;
		this.timer = null;
		this.StartTimerCaseData();
	}

	/**
	 * @description Create a singleton instance of MemoryStore.
	 * @param interval time in milliseconds to expires data in store.
	 * @returns instance of MemoryStore.
	 */
	public static Create(interval = 15000): MemoryStore {
		if (MemoryStore.instance) return MemoryStore.instance;
		MemoryStore.instance = new MemoryStore(interval);
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
 * @default interval `15000` = `15 sec`
 * @default message `Blocked by proxy. Try again in a moment!`
 */
export const blockDDoS = (interval = 15000, message = defaultMsg): Middleware => {
	return (req: Requests, res: Responses, next: NextFunctions): Payload => {
		const store = MemoryStore.Create(interval);
		const info = Info.Create(req, interval);
		const hash = Info.GetHash(req);
		const blocked = store.Exists(hash);
		if (blocked) return res.status(403).json({ message });
		store.Save(info);
		return next();
	};
};

export default blockDDoS;
