import { 
  listRunningKernels, connectToKernel, startNewKernel
} from './kernel';

// get a list of available kernels and connect to one
listRunningKernels('http://localhost:8000').then((kernelModels) => {
  var options = {
    baseUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost',
    name: kernelmodels[0].name
  }
  connectToKernel(kernelModels[0].id, options).then((kernel) => {
    console.log(kernel.name);
  });
});

// start a new kernel
var options = {
  baseUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost',
  name: 'python'
}
startNewKernel(options).then((kernel) => {
  // execute and handle replies
  var future = kernel.execute('a = 1');
  future.onDone = () => {
    console.log('Future is fulfilled');
  }
  future.onIOPub = (msg) => {
    console.log(msg.content);  // rich output data
  }

  // restart the kernel and then send an inspect message
  kernel.restart().then(() => {
    kernel.inspect('hello', 5).then((msg) => {
      console.log(msg.content);
    });
  });

  // interrupt the kernel and then send a complete message
  kernel.interrupt().then(() => {
    kernel.complete('impor', 4).then((msg) => {
      console.log(msg.content);
    });
  });

  // register a callback for when the kernel changes state
  kernel.statusChanged.connect((status) => {
    console.log('status', status);
  });

  // kill the kernel
  kernel.shutdown().then(() => {
    console.log('Kernel shut down');
  })
});
