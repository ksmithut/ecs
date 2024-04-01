declare namespace _default {
    export { string };
    export { number };
    export { boolean };
    export { isNull as null };
    export { isUndefined as undefined };
    export { or };
    export { nullable };
    export { optional };
    export { array };
    export { object };
    export { instanceOf };
}
export default _default;
export type TypeChecker<T> = (value: unknown) => value is T;
export type TypeCheckerType<TTypeChecker> = TTypeChecker extends TypeChecker<infer X> ? X : never;
declare function string(): (value: unknown) => value is string;
declare function number(): (value: unknown) => value is number;
declare function boolean(): (value: unknown) => value is boolean;
declare function isNull(): (value: unknown) => value is null;
declare function isUndefined(): (value: unknown) => value is void | undefined;
declare function or<TA, TB>(isA: TypeChecker<TA>, isB: TypeChecker<TB>): (value: unknown) => value is TA | TB;
declare function nullable<T>(check: TypeChecker<T>): (value: unknown) => value is T | null;
declare function optional<T>(check: TypeChecker<T>): (value: unknown) => value is void | T | undefined;
declare function array<T>(check: TypeChecker<T>): (value: unknown) => value is T[];
declare function object<TShape extends {
    [key: string]: TypeChecker<any>;
}>(shape: TShape): (value: unknown) => value is { [Property in keyof TShape]: TypeCheckerType<TShape[Property]>; };
declare function instanceOf<T extends new (...args: any[]) => any>(c: T): (value: unknown) => value is InstanceType<T>;
