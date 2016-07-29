
require(['jquery', 'jupyter-js-services'], function ($, services) {
  'use strict';

  var baseUrl = services.utils.getBaseUrl();

  // need ajaxSettings.withCredentials = true
  // for cookies to be sent to the server
  var options = {
    ajaxSettings: {
      withCredentials: true,
    }
  };

  services.listRunningKernels(options)
    .then(function (success) {

      var startNewKernel = services.startNewKernel;
      $('#kernel-info').text('Starting...');

      var kernelOptions = {
        name: 'python',
        ajaxSettings: options.ajaxSettings,
      };

    // start a single kernel for the page
    startNewKernel(kernelOptions).then(function (kernel) {
      console.log('Kernel started:', kernel);
      kernel.kernelInfo().then(function (reply) {
        var content = reply.content;
        $('#kernel-info').text(content.banner);
        console.log('Kernel info:', content);
      });
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
  }).catch(function (error) {
    if (error.xhr.status === 302) {
      $("#kernel-info").text('').append(
        // FIXME: can't use ?next=window.location, because notebook server
        // restricts login redirect to its own pages.
        // open a new tab, instead.
        $("<a>").attr('href', baseUrl + 'login')
        .attr('target', '_blank')
        .text("Click here to login with the notebook server.")
      ).append(
        $("<p>").text("Reload the page once login is complete.")
      );
    } else {
      console.error(error);
    }
  });
});
