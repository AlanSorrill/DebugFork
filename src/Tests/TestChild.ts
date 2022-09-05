
import inspector from 'inspector'
import { DebugFork } from '../DebugFork/DebugFork';
DebugFork.emitInspectorUrl().then(()=>test())
let count = 0;
function test(){
    console.log('test');
    process.send({message: 'test ipc'})
    count++
    if(count > 10){
        count = 0;
        console.log('testHold')
        debugger;
    }
    setTimeout(test, 1000)
}