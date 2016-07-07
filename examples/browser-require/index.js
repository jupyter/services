
require(['jupyter-js-services', 'jupyter-js-utils'], function (services, utils) {
  "uses strict";
  var startNewKernel = services.startNewKernel;
  var BASE_URL = utils.getBaseUrl();
  
  var kernelOptions = {
    baseUrl: BASE_URL,
    name: 'python',
  };

  // start a single kernel for the page
  startNewKernel(kernelOptions).then(function (kernel) {
    console.log('kernel started', kernel);
    kernel.kernelInfo().then(function (reply) {
      var content = reply.content;
      $("#kernel-info").text(content.banner);
      console.log(info);
    })
    $("#run").click(function () {
      var code = $("#cell").val();
      console.log("executing", code);
      // clear output
      $("#output").text("");
      // Execute and handle replies on the kernel.
      var future = kernel.execute({ code: code });
      // record each IOPub message
      future.onIOPub = function (msg) {
        console.log('Got IOPub', msg);
        $("#output").append(
          $("<pre>").text("msg_type: " + msg.header.msg_type)
        );
        $("#output").append(
          $("<pre>").text(JSON.stringify(msg.content))
        );
      };

      future.onReply = function (reply) {
        console.log('Got execute reply');
      };

      future.onDone = function () {
        console.log('Future is fulfilled');
        $("#output").append($("<pre>").text("Done!"));
      };
    });
  });
});
