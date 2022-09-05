import { DebugFork, delay } from "../DebugFork/DebugFork";

let nodeInspector = new DebugFork(__dirname + '/TestChild.js', {
    onIpcMessage(msg) {
        console.log(`IPC: ${JSON.stringify(msg)}`)
    },
    onStdErr(msg) {
        console.error(`stderr: ${msg}`)
    },
    onStdOut(msg) {
        console.log(`stdout: ${msg}`)
    },
});

nodeInspector.on('Debugger.paused', async (evt) => {
    console.log(`Paused ${JSON.stringify(evt)}`)
    await delay(5000);
    console.log('resuming')
    await nodeInspector.debugger.resume({})
    console.log('Resumed')


})
