import type { Snippet } from "svelte";

import { getContext, setContext } from "svelte";
import { writable, type Writable } from "svelte/store";

type Registry = Map<string, Writable<Entry[]>>;

interface Entry {
    id: symbol;
    snippet: Snippet;
}

const KEY = Symbol();

export function initPortals() {
    const registry: Registry = new Map();
    setContext(KEY, registry);
}

function getRegistry() {
    return getContext<Registry>(KEY);
}

function getStore(name: string) {
    const registry = getRegistry();

    if (!registry.has(name)) {
        registry.set(name, writable([]));
    }

    return registry.get(name)!;
}

export function registerPortal(
    name: string,
    snippet: Snippet
) {
    const store = getStore(name);

    const entry: Entry = {
        id: Symbol(),
        snippet
    };

    store.update((x) => [...x, entry]);

    return () => {
        store.update((x) => x.filter((e) => e.id !== entry.id));
    };
}

export function portalStore(name: string) {
    return getStore(name);
}