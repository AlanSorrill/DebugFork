export namespace Debugger {

    export type Location = {
        scriptId: Runtime.ScriptId
        lineNumber: number//integer
        columnNumber?: number//integer
    }
    export type Scope = {
        type: 'global' | 'local' | 'with' | 'closure' | 'catch' | 'block' | 'script' | 'eval' | 'module' | 'wasm-expression-stack'
        object: Runtime.RemoteObject
        name?: string
        startLocation?: Location
        endLocation?: Location
    }
    export type CallFrame = {
        callFrameId: string,
        functionName: string
        functionLocation?: Location
        location: Location
        url: string
        scopeChain: Scope[]
        this: Runtime.RemoteObject
        returnValue?: Runtime.RemoteObject
        canBeRestarted?: boolean
    }
    export type DebugSymbols = {
        type: 'None' | 'SourceMap' | 'EmbeddedDWARF' | 'ExternalDWARF',
        externalUrl?: string
    }
    export type BreakpointId = string
    export type ScriptLanguage = 'JavaScript' | 'WebAssembly'
}

export namespace Runtime {
    export type ExceptionId = string
    export type ExceptionDetails = {
        exceptionId: ExceptionId,
        text: string
        lineNumber: number
        columnNumber: number
        scriptId?: ScriptId,
        url?: string
        stackTrace?: StackTrace
        exception?: RemoteObject
        executionContextId?: ExecutionContextId
        exceptionMetaData?: Object
    }
    export type RemoteObject = {
        type: 'object' | 'function' | 'undefined' | 'string' | 'number' | 'boolean' | 'symbol' | 'bigint',
        subType?: 'array' | 'null' | 'node' | 'regexp' | 'date' | 'map' | 'set' | 'weakmap' | 'weakset' | 'iterator' | 'generator' | 'error' | 'proxy' | 'promise' | 'typedarray' | 'arraybuffer' | 'dataview' | 'webassemblymemory' | 'wasmvalue'
        className?: string
        value?: any
        unserializableValue?: string
        description?: string
        webDriverValue?: WebDriverValue
        preview?: ObjectPreview
        // customPreview?: CustomPreview
    }
    export type ObjectPreview = {
        type: 'object' | 'function' | 'undefined' | 'string' | 'number' | 'boolean' | 'symbol' | 'bigint'
        subType?: RemoteObject['subType']
        description?: string
        overflow: boolean
        properties: PropertyPreview[]
        // entries?: EntryPreview[]
    }
    export type PropertyPreview = {
        name: string,
        type: 'object' | 'function' | 'undefined' | 'string' | 'number' | 'boolean' | 'symbol' | 'accessor' | 'bigint'
    }
    export type StackTrace = {
        description?: Debugger.BreakpointId
        callFrames: Debugger.CallFrame[]
        parent?: StackTrace
        parentId?: string
    }
    export type WebDriverValue = {
        type: 'undefined' | 'null' | 'string' | 'number' | 'boolean' | 'bigint' | 'regexp' | 'date' | 'symbol' | 'array' | 'object' | 'function' | 'map' | 'set' | 'weakmap' | 'weakset' | 'error' | 'proxy' | 'promise' | 'typedarray' | 'arraybuffer' | 'node' | 'window'
        value?: any
        objectId: string
    }
    export type RemoteObjectId = string
    export type ExecutionContextId = number
    export type ScriptId = string
    export type UniqueDebuggerId = string
}

export type V8Events = {
    'Debugger.breakpointResolved': {
        breakpointId: string,
        location: Debugger.Location
    },
    'Debugger.paused': {
        callFrames: Debugger.CallFrame[],
        reason: 'ambiguous' | 'assert' | 'CSPViolation' | 'debugCommand' | 'DOM' | 'EventListener' | 'exception' | 'instrumentation' | 'OOM' | 'other' | 'promiseRejection' | 'XHR',
        data?: Object
        hitBreakpoints: Debugger.BreakpointId[],
        asyncStackTrace?: Runtime.StackTrace
        asyncStackTraceId?: string
        asyncCallStackTraceId?: string
    },
    'Debugger.resumed': {},
    'Debugger.scriptFailedToParse': {
        scriptId: Runtime.ScriptId,
        url: string,
        startLine: number, // integer
        startColumn: number, //integer
        endLine: number, //integer
        endColumn: number,  //integer
        executionContextId: Runtime.ExecutionContextId,
        hash: string,
        executionContextAuxData?: Object
        sourceMapUrl?: string
        hasSourceUrl?: boolean
        isModule?: boolean
        length?: number,
        stackTrace?: Runtime.StackTrace,
        codeOffset: number //integer
        scriptLanguage: Debugger.ScriptLanguage
        embedderName?: string
    },
    'Debugger.scriptParsed': {
        scriptId: Runtime.ScriptId,
        url: string
        startLine: number
        startColumn: number
        endLine: number
        endColumn: number
        executionContextId: Runtime.ExecutionContextId
        hash: string
        executionContextAuxData?: Object
        isLiveEdit?: boolean
        sourceMapUrl?: string
        hasSourceUrl?: boolean
        isModule?: boolean
        length?: number
        stackTrace?: Runtime.StackTrace,
        codeOffset?: number
        scriptLanguage?: Debugger.ScriptLanguage,
        debuggerSymbols?: Debugger.DebugSymbols,
        embedderName?: string
    }
}
export type V8Function<ParamObj, ReturnObj> = [ParamObj, ReturnObj]
export type V8Functions = {
    Debugger: {
        'enable': V8Function<{ maxScriptsCacheSize?: number }, { debuggerId: Runtime.UniqueDebuggerId }>


        resume: V8Function<{ terminateOnResume?: boolean }, void>
        pause: V8Function<{}, void>

    },
    Runtime: {
        'runScript': V8Function<{
            scriptId: Runtime.ScriptId,
            executionContextId?: Runtime.ExecutionContextId,
            objectGroup?: string,
            silent?: boolean,
            includeCommandLineAPI?: boolean,
            returnByValue?: boolean,
            generatePreview?: boolean,
            awaitPromise?: boolean
        }, {
            result: Runtime.RemoteObject,
            exceptionDetails: Runtime.ExceptionDetails
        }>
        runIfWaitingForDebugger: V8Function<{

        }, {

            }>
    }
}
export type V8FunctionDomain = keyof V8Functions


export type V8FunctionName = Join<ShallowPath, '.'>
export type V8FunctionSubName<NameSpace extends Extract<keyof V8Functions, string>, FuncName extends Extract<keyof (V8Functions[NameSpace]), string>> = `${NameSpace}.${FuncName}`
export type V8FunctionParam<FuncName extends V8FunctionName> = FuncName extends V8FunctionSubName<infer NameSpace, infer FuncName> ? (V8Functions[NameSpace][FuncName] extends V8Function<infer P, infer R> ? P : never) : never
export type V8FunctionReturn<FuncName extends V8FunctionName> = FuncName extends V8FunctionSubName<infer NameSpace, infer FuncName> ? (V8Functions[NameSpace][FuncName] extends V8Function<infer P, infer R> ? R : never) : never



// export type V8ParamType<FunctionName extends V8FunctionName> = PropertyType<V8Functions, FunctionName> extends V8Function<infer P, infer R> ? P : never

export type V8CallWrapperType<NameSpace extends keyof V8Functions> = {
    [Prop in keyof V8Functions[NameSpace]]: V8Functions[NameSpace][Prop] extends V8Function<infer ParamObj, infer ReturnObj> ? ((params: ParamObj) => Promise<ReturnObj>) : never
}
export function isV8EventMessage<eventName extends keyof V8Events>(msg: V8Message): msg is V8EventMessage<eventName> {
    return typeof msg['method'] == 'string'
}
export function isV8ReturnMessage(msg: V8Message): msg is V8ReturnMessage {
    return typeof msg['id'] == 'number'
}
export type V8EventMessage<EventName extends keyof V8Events> = {
    method: EventName,
    params: V8Events[EventName]
}
export type V8ReturnMessage = {
    id: number,
    result: any
}
export type V8Message = V8EventMessage<keyof V8Events> | V8ReturnMessage


type ShallowPath = {
    [NameSpace in Extract<keyof V8Functions, string>]: {
        [FuncName in Extract<keyof (V8Functions[NameSpace]), string>]: [NameSpace, FuncName]
    }[Extract<keyof (V8Functions[NameSpace]), string>]
}[Extract<keyof V8Functions, string>]


// type PropertyType<Type, Property extends string> = string extends Property ? unknown : Property extends keyof Type ? Type[Property] : Property extends `${number}` ? Type extends ReadonlyArray<infer ArrayType> ? ArrayType : unknown : Property extends `${infer Key}.${infer Rest}` ? Key extends `${number}` ? Type extends ReadonlyArray<infer ArrayType> ? PropertyType<ArrayType, Rest> : unknown : Key extends keyof Type ? Type[Key] extends Map<string, infer MapType> ? MapType : PropertyType<Type[Key], Rest> : unknown : unknown;
type Join<T extends unknown[], D extends string> = T extends [] ? '' : T extends [string | number] ? `${T[0]}` : T extends [string | number, ...infer R] ? `${T[0]}${D}${Join<R, D>}` : string;
// type NestedPaths<Type> = Type extends string | number | boolean | Date | RegExp | Buffer | Uint8Array | ((...args: any[]) => any) | {
//     _bsontype: string;
// } ? [] : Type extends ReadonlyArray<infer ArrayType> ? [] | [number, ...NestedPaths<ArrayType>] : Type extends Map<string, any> ? [string] : Type extends object ? {
//     [Key in Extract<keyof Type, string>]: Type[Key] extends Type ? [Key] : Type extends Type[Key] ? [Key] : Type[Key] extends ReadonlyArray<infer ArrayType> ? Type extends ArrayType ? [Key] : ArrayType extends Type ? [Key] : [
//         Key,
//         ...NestedPaths<Type[Key]>
//     ] : // child is not structured the same as the parent
//     [
//         Key,
//         ...NestedPaths<Type[Key]>
//     ] | [Key];
// }[Extract<keyof Type, string>] : [];