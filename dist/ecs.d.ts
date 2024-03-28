export function createComponent<TState extends import("./validate.js").TypeChecker<any>>(state: TState): Component<TState>;
export function createSystem<TState extends import("./validate.js").TypeChecker<any>, TQueries extends {
    [key: string]: Component<any>[];
}>(state: TState, queries: TQueries, execute: (state: import("./validate.js").TypeCheckerType<TState>, delta: number, queries: { [Property in keyof TQueries]: Set<Entity>; }) => void, init?: ((state: import("./validate.js").TypeCheckerType<TState>) => (() => void)) | undefined): System<TState, TQueries>;
export function getComponent<TComponent extends Component<any>>(entity: Entity, component: TComponent): ComponentType<TComponent>;
export function addComponent<TComponent extends Component<any>>(entity: Entity, component: TComponent, componentState: ComponentType<TComponent>): Entity;
export function removeComponent(entity: Entity, component: Component<any>): Entity;
export function isAdded(query: Set<Entity>, entity: Entity): boolean;
export function isRemoved(query: Set<Entity>, entity: Entity): boolean;
export function removeEntity(entity: Entity): void;
export function createWorld(): Readonly<{
    registerSystem<TSystem extends System<any, any>>(system: TSystem, state: SystemState<TSystem>): Readonly<any>;
    createEntity(): Entity;
    execute(delta: number): void;
    stop(): void;
}>;
export type Entity = {};
export type Component<TState extends import("./validate.js").TypeChecker<any>> = {
    state: TState;
};
export type ComponentType<TComponentType> = TComponentType extends Component<import("./validate.js").TypeChecker<infer X>> ? X : never;
export type System<TState extends import("./validate.js").TypeChecker<any>, TQueries extends {
    [key: string]: Component<any>[];
}> = {
    state: TState;
    queries: TQueries;
    execute: (state: import('./validate.js').TypeCheckerType<TState>, delta: number, queries: { [Property in keyof TQueries]: Set<Entity>; }) => void;
    init?: ((state: import('./validate.js').TypeCheckerType<TState>) => (() => void)) | undefined;
};
export type SystemState<TSystemState> = TSystemState extends System<import("./validate.js").TypeChecker<infer X>, any> ? X : never;
export type SystemInstance = {
    system: System<import("./validate.js").TypeChecker<any>, {
        [key: string]: Component<any>[];
    }>;
    state: any;
    queries: {
        key: string;
        query: EntityQuery;
        entities: Set<Entity>;
    }[];
};
export type EntityQuery = ReturnType<typeof createEntityQuery>;
export type World = ReturnType<typeof createWorld>;
export type EntityState = {
    remove: boolean;
    components: Map<Component<any>, any>;
    componentsToRemove: Set<Component<any>>;
    addedTo: Set<Set<Entity>>;
    removedFrom: Set<Set<Entity>>;
    onChange: (entity: Entity) => void;
};
declare function createEntityQuery(components: Component<any>[]): (entityComponents: Set<Component<any>>) => boolean;
export {};
