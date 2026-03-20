/// <reference types="vite-plugin-glsl/ext" />

interface ImportMetaEnv {
	readonly VITE_PLAYGROUND_ROBOTS: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
