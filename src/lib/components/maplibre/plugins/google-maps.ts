import { addProtocol, type GetResourceResponse, type RequestParameters } from 'maplibre-gl';

const sessions: Record<string, { value: string | undefined; promise: Promise<string> }> = {};

let protocolRegistered = false;
let registerProtocol: Promise<boolean> | undefined = undefined;

const testGoogleMapsAPI = async (apiKey: string): Promise<boolean> => {
	try {
		await getSession('roadmap', apiKey);
		return true;
	} catch {
		return false;
	}
};

export const registerGoogleMapsProtocol = async (apiKey: string): Promise<boolean> => {
	if (protocolRegistered) {
		return true;
	}

	registerProtocol = (async () => {
		const passed = await testGoogleMapsAPI(apiKey);
		if (!passed) {
			return false;
		}

		addProtocol('google', googleProtocol);
		protocolRegistered = true;
		return true;
	})();

	return registerProtocol;
};

const googleProtocol = async (
	params: RequestParameters
): Promise<GetResourceResponse<ArrayBuffer>> => {
	const url = new URL(params.url.replace('google://', 'https://'));
	const key = url.searchParams.get('key') ?? '';
	const sessionKey = `${url.hostname}?${url.searchParams}`;
	let session: string;
	if (!sessions[sessionKey]) {
		sessions[sessionKey] = {
			value: undefined,
			promise: getSession(url.hostname, key)
		};
		session = await sessions[sessionKey].promise;
	} else if (sessions[sessionKey].value === undefined) {
		session = await sessions[sessionKey].promise;
	} else {
		session = sessions[sessionKey].value;
	}

	return getTile(url, session, key);
};

const getSession = async (mapType: string, key: string): Promise<string> => {
	const sessionRequest: Record<string, unknown> = {
		mapType,
		language: 'en-US',
		region: 'US',
		overlay: true
	};

	const response = await fetch(`https://tile.googleapis.com/v1/createSession?key=${key}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(sessionRequest)
	});

	if (!response.ok) {
		throw new Error('Failed to create Google Maps session');
	}

	const result = (await response.json()) as { session: string };
	return result.session;
};

const getTile = async (url: URL, session: string, key: string) => {
	const tile = await fetch(
		`https://tile.googleapis.com/v1/2dtiles${url.pathname}?session=${session}&key=${key}`
	);

	if (!tile.ok) {
		throw new Error('Failed to get Google Maps tile');
	}

	const data = await tile.arrayBuffer();
	return { data };
};
