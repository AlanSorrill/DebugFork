//https://chromedevtools.github.io/devtools-protocol/tot/Debugger/
import WebSocketStuff from 'ws'
import NInspector from 'node:inspector'
import { ChildProcess, fork } from 'child_process'
import inspector, { Session, Runtime } from 'inspector'
import { Debugger, isV8EventMessage, isV8ReturnMessage, V8CallWrapperType, V8EventMessage, V8Events, V8FunctionName, V8FunctionParam, V8FunctionReturn, V8Functions, V8Message, V8ReturnMessage } from './V8Types'
let test: Debugger.Location


export type NodeInspector_Options<IPCMessage> = {
    onIpcMessage(msg: IPCMessage): void
    onStdOut(msg: string): void
    onStdErr(msg: string): void
}

export class DebugFork<IPCMessage> {
    private socket: WebSocketStuff.WebSocket;
    private child: ChildProcess;
    private sourceFilePath: string;
    private options: NodeInspector_Options<IPCMessage>
    constructor(sourceFilePath: string, options: NodeInspector_Options<IPCMessage>) {
        this.sourceFilePath = sourceFilePath;
        this.options = options
        this.init();
    }
    static InspectUrlPrefix: string = '!!~~InspectUrl='
    static async emitInspectorUrl() {
        inspector.open(3002, '127.0.0.1', false)
        return new Promise<void>((acc) => {
            setTimeout(() => {
                console.log(DebugFork.InspectUrlPrefix + inspector.url())
                inspector.waitForDebugger();
                acc();
            }, 1000)
        })
    }
    private async connectToInspectorUrl(url: string) {
        let ths = this;
        console.log(`Inspecting ${url}`)


        return new Promise<void>((acc) => {
            ths.socket = new WebSocketStuff.WebSocket(url);
            ths.socket.on('open', () => {
                console.log(`Inspector socket open`)
                acc();
                
            })
            ths.socket.on('error', (err) => {
                console.log(`Inspector socket error: ${err.message}`)
            })
            ths.socket.on('message', (data) => {
                ths.recieveFromV8(JSON.parse(data.toString()) as any)
            })
        })
    }
    kill(){
        console.log(`Killing child process`)
        if(this.child && !this.child.killed){
            this.child.kill()
        }
    }
    private init() {
        let ths = this;
        process.on('beforeKill', ()=>{
            ths.kill()
        })
        process.on('kill', ()=>{
            ths.kill()
            process.exit(0);
        })
        process.on('SIGINT', ()=>{
            ths.kill();
            process.exit(0);
        })
        process.on('SIGTERM', ()=>{
            ths.kill();
            process.exit(0);
        })
        this.child = fork(this.sourceFilePath, ['--inspect'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })
        // this.child.stdout.setEncoding('utf8')
        // this.child.
        this.child.stdout.on('data', (chunk) => {
            let data = chunk.toString() as string
            if (data.startsWith(DebugFork.InspectUrlPrefix)) {
                ths.connectToInspectorUrl(data.replace(DebugFork.InspectUrlPrefix, '')).then(()=>ths.onInspectorStarted())
            } else {
                ths.options.onStdOut(data);
            }

        })
        this.child.stderr.on('data', (chunk) => {
            let data = chunk.toString() as string
            ths.options.onStdErr(data);
        })
        this.child.on('message', (msg, sendHandle) => {
            ths.options.onIpcMessage(msg as any);
        })
        
        // this.socket = new WebSocketStuff.WebSocket(``);
    }
    private async onInspectorStarted(){
        this.on('Debugger.scriptParsed', this.onScriptParsed)
        let enableResponse = await this.debugger.enable({})
        await this.runtime.runIfWaitingForDebugger({})
        console.log(`Started debugger sesh on ${enableResponse.debuggerId}`) 

    }
    onScriptParsed(scriptData: V8Events['Debugger.scriptParsed']) {
        scriptData.scriptId
    }

    debugger = this.createCallWrapper('Debugger')
    runtime = this.createCallWrapper('Runtime')


    private createCallWrapper<NameSpace extends keyof V8Functions>(nameSpace: NameSpace): V8CallWrapperType<NameSpace> {
        let ths = this
        type Wrapper = V8CallWrapperType<NameSpace>

        return new Proxy({}, {
            get: (target, p) => {
                let methodName = `${nameSpace}.${typeof p == 'string' ? p : p.toString()}`
                return (params: Object) => {
                    return ths.v8Call(methodName as any, params as any);
                }
            },
        }) as any;
    }
    private callCount: number = 0
    private callCallbacks: Map<number, (params: Object) => void> = new Map()
    async v8Call<MethodName extends V8FunctionName>(method: MethodName, params: V8FunctionParam<MethodName>): Promise<V8FunctionReturn<MethodName>> {
        let ths = this;
        return new Promise<V8FunctionReturn<MethodName>>((acc) => {
            let id = this.callCount++;
            ths.callCallbacks.set(id, acc);
            this.socket.send(JSON.stringify({ id: id, method: method, params: params }))
        })
    }

    private eventCallbacks: Map<keyof V8Events, Array<(evt: V8Events[keyof V8Events]) => void>> = new Map();
    on<EventName extends keyof V8Events>(eventName: EventName, callback: (event: V8Events[EventName]) => void) {
        if (!this.eventCallbacks.has(eventName)) {
            this.eventCallbacks.set(eventName, [callback])
        } else {
            this.eventCallbacks.get(eventName).push(callback);
        }
    }
    private recieveFromV8(message: V8Message) {
        if (!message) {
            throw new Error(`Recieved blank message`)
        }
        if (isV8ReturnMessage(message)) {
            if (this.callCallbacks.has(message.id)) {
                this.callCallbacks.get(message.id)(message.result)
                this.callCallbacks.delete(message.id)
            } else {
                console.error(`No callback for message ${JSON.stringify(message)}`)
            }
        } else if (isV8EventMessage(message)) {
            if (this.eventCallbacks.has(message.method)) {
                this.eventCallbacks.get(message.method).forEach(callback => {
                    callback(message);
                })
            } else {
                console.log(`V8Event: ${message.method}`)
            }
        } else {
            console.error(`Unknown message type: ${JSON.stringify(message)}`)
            return;
        }


    }
    // init() {
    //     this.child = spawn('node',['--inspect', __dirname + '/Child.js'], {shell: true})
    //     // this.child.stdout.setEncoding('utf8')
    //     // this.child.
    //     let ths = this;
    //     this.child.stdout.on('data', (chunk)=>{
    //         let data = chunk.toString() as string
    //         if(typeof data == 'string'){
    //             if(data.startsWith('InspectUrl=')){
    //                 ths.startInspecting(data.replace('InspectUrl=',''))
    //             }
    //         }
    //         console.log(`ChildData: ${data}`)
    //     })
    //     this.child.on('message', (msg, sendHandle) => {
    //         console.log(`Child: ${msg}`)
    //     })
    //     console.log('test')
    //     // this.socket = new WebSocketStuff.WebSocket(``);
    // }
}



export function delay(length: number): Promise<void> {
    return new Promise((acc) => {
        setTimeout(acc, length)
    })
}