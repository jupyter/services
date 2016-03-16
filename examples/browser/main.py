"""
Copyright (c) Jupyter Development Team.
Distributed under the terms of the Modified BSD License.
"""
import re
import subprocess
import sys
import threading

import tornado.web

PORT = 8765


class MainPageHandler(tornado.web.RequestHandler):

    def initialize(self, base_url):
        self.base_url = base_url

    def get(self):
        return self.render("index.html", static=self.static_url,
                           base_url=self.base_url)


def main():
    # Start a notebook server with cross-origin access.
    url = "http://localhost:%s" % PORT

    nb_command = [sys.executable, '-m', 'notebook', '--no-browser', '--debug',
                  '--NotebookApp.allow_origin="%s"' % url]
    nb_server = subprocess.Popen(nb_command, stderr=subprocess.STDOUT,
                                 stdout=subprocess.PIPE)

    # Wait for notebook server to start up.
    # Extract the url used by the server.
    while 1:
        line = nb_server.stdout.readline().decode('utf-8').strip()
        if not line:
            continue
        print(line)
        if 'Jupyter Notebook is running at:' in line:
            base_url = re.search('(http.*?)$', line).groups()[0]
            break

    # Wait for the server to finish starting up.
    while 1:
        line = nb_server.stdout.readline().decode('utf-8').strip()
        if not line:
            continue
        print(line)
        if 'Control-C' in line:
            break

    def print_server_output():
        """Print output from the notebook server"""
        while 1:
            line = nb_server.stdout.readline().decode('utf-8').strip()
            if not line:
                continue
            print(line)

    # Start a thread to print output from the notebook server.
    thread = threading.Thread(target=print_server_output)
    thread.setDaemon(True)
    thread.start()

    # Set up the web server and start the event loop.
    handlers = [
        (r"/", MainPageHandler, {'base_url': base_url}),
        (r'/(.*)', tornado.web.StaticFileHandler, {'path': '.'}),
    ]

    app = tornado.web.Application(handlers, static_path='build',
                                  template_path='.',
                                  compiled_template_cache=False)

    app.listen(PORT, 'localhost')
    loop = tornado.ioloop.IOLoop.instance()
    print('Browse to http://localhost:%s' % PORT)
    try:
        loop.start()
    except KeyboardInterrupt:
        print(" Shutting down on SIGINT")
    finally:
        nb_server.kill()
        loop.close()

if __name__ == '__main__':
    main()
