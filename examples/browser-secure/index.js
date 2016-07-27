
require(['jquery', 'jupyter-js-services'], function ($, services) {
  'use strict';

  var baseUrl = services.utils.getBaseUrl();
  var url = services.utils.urlPathJoin(baseUrl, 'login');
  services.utils.ajaxRequest(url, {
    data: JSON.stringify({ password: 'password' }),
    method: 'POST',
    contentType: 'application/json'
  }).then(function (success) {

      var startNewKernel = services.startNewKernel;

      var kernelOptions = {
        name: 'python',
        ajaxSettings: {
          withCredentials: true,
          password: 'password'
        }
      };

    // start a single kernel for the page
    startNewKernel(kernelOptions).then(function (kernel) {
      console.log('Kernel started:', kernel);
      kernel.kernelInfo().then(function (reply) {
        var content = reply.content;
        $('#kernel-info').text(content.banner);
        console.log('Kernel info:', content);
      })
      $('#run').click(function () {
        var code = $('#cell').val();
        console.log('Executing:', code);
        // clear output
        $('#output').text('');
        // Execute and handle replies on the kernel.
        var future = kernel.execute({ code: code });
        // record each IOPub message
        future.onIOPub = function (msg) {
          console.log('Got IOPub:', msg);
          $('#output').append(
            $('<pre>').text('msg_type: ' + msg.header.msg_type)
          );
          $('#output').append(
            $('<pre>').text(JSON.stringify(msg.content))
          );
        };

        future.onReply = function (reply) {
          console.log('Got execute reply');
        };

        future.onDone = function () {
          console.log('Future is fulfilled');
          $('#output').append($('<pre>').text('Done!'));
        };
      });
    });
  });
});
