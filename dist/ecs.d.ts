export function createComponent<TSchema extends import("./validate.js").TypeChecker<any>>(schema: TSchema): Component<TSchema>;
export function createSystem<TSchema extends import("./validate.js").TypeChecker<any>, TQueries extends {
    [key: string]: readonly Component<any>[];
}>(schema: TSchema, queries: TQueries, execute: (state: import("./validate.js").TypeCheckerType<TSchema>, delta: number, queries: { [Property in keyof TQueries]: QueryResults; }) => void, init?: ((state: import("./validate.js").TypeCheckerType<TSchema>) => () => void) | undefined): System<TSchema, TQueries>;
export function getComponent<TComponent extends Component<any>>(entity: Entity, component: TComponent): ComponentSchema<TComponent>;
export function hasComponent<TComponent extends Component<any>>(entity: Entity, component: TComponent): boolean;
export function getRemovedComponent<TComponent extends Component<any>>(entity: Entity, component: TComponent): ComponentSchema<TComponent>;
export function hasRemovedComponent<TComponent extends Component<any>>(entity: Entity, component: TComponent): boolean;
export function addComponent<TComponent extends Component<any>>(entity: Entity, component: TComponent, data: ComponentSchema<TComponent>): Entity;
export function removeComponent(entity: Entity, component: Component<any>): Entity;
export function removeEntity(entity: Entity): Entity;
export function createEntity(): Entity;
export function createWorld(): Readonly<{
    createEntity(): Entity;
    registerSystem<TSystem extends System<any, any>>(system: TSystem, state: SystemSchema<TSystem>): Readonly<any>;
    execute(delta: number): void;
}>;
export { default as v } from "./validate.js";
export class Entity {
}
export type Component<TSchema extends import("./validate.js").TypeChecker<any>> = {
    schema: TSchema;
};
export type ComponentSchema<TComponentSchema> = TComponentSchema extends Component<import("./validate.js").TypeChecker<infer X>> ? X : never;
export type QueryResults = {
    results: Set<Entity>;
    added: Set<Entity>;
    removed: Set<Entity>;
};
export type System<TSchema extends import("./validate.js").TypeChecker<any>, TQueries extends {
    [key: string]: readonly Component<any>[];
}> = {
    schema: TSchema;
    queries: TQueries;
    execute: (state: import('./validate.js').TypeCheckerType<TSchema>, delta: number, queries: { [Property in keyof TQueries]: QueryResults; }) => void;
    init: (state: import('./validate.js').TypeCheckerType<TSchema>) => () => void;
};
export type SystemSchema<TSystemSchema> = TSystemSchema extends System<import("./validate.js").TypeChecker<infer X>, any> ? X : never;
export type EntityState = {
    components: Map<Component<any>, any>;
    removedComponents: Map<Component<any>, any>;
};
export type SystemInstance<TSystem extends System<any, any>> = {
    close: () => void;
    state: SystemSchema<TSystem>;
    system: TSystem;
    queries: {
        key: string;
        query: ReturnType<typeof createQuery>;
        entities: QueryResults;
    };
};
export type World = ReturnType<typeof createWorld>;
export type WorldInternalFunctions = {
    addComponent: typeof addComponent;
    removeComponent: typeof removeComponent;
    removeEntity: typeof removeEntity;
    getComponent: typeof getComponent;
    hasComponent: typeof hasComponent;
    getRemovedComponent: typeof getRemovedComponent;
    hasRemovedComponent: typeof hasRemovedComponent;
};
declare function createQuery(components: ReadonlyArray<Component<any>>): (entityComponents: Map<Component<any>, any>) => boolean;
