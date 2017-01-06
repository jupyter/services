# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from __future__ import print_function, absolute_import

import atexit
import subprocess
import sys
import os
import shutil
import tempfile
from multiprocessing.pool import ThreadPool

from tornado import ioloop
from notebook.notebookapp import NotebookApp
from traitlets import Bool, Unicode


def create_notebook_dir():
    """Create a temporary directory with some file structure."""
    root_dir = tempfile.mkdtemp(prefix='mock_contents')
    os.mkdir(os.path.join(root_dir, 'src'))
    with open(os.path.join(root_dir, 'src', 'temp.txt'), 'w') as fid:
        fid.write('hello')
    atexit.register(lambda: shutil.rmtree(root_dir, True))
    return root_dir


def run_task(func, args=(), kwds={}):
    """Run a task in a thread and exit with the return code."""
    loop = ioloop.IOLoop.instance()
    worker = ThreadPool(1)

    def callback(result):
        loop.add_callback(lambda: sys.exit(result))

    def start():
        worker.apply_async(func, args, kwds, callback)

    loop.call_later(1, start)


def run_mocha(base_url, token, terminalsAvailable):
    """Run the mocha command and return its return value"""
    mocha_command = ['mocha', '--timeout', '20000',
                     '--retries', '2',
                    'build/integration.js',
                     '--baseUrl=%s' % base_url,
                     '--terminalsAvailable=%s' % terminalsAvailable]
    if token:
        mocha_command.append('--token=%s' % token)
    return subprocess.check_call(mocha_command)


class TestApp(NotebookApp):
    """A notebook app that runs a mocha test."""

    open_browser = Bool(False)
    notebook_dir = Unicode(create_notebook_dir())

    def start(self):
        terminals_available = self.web_app.settings['terminals_available']
        run_task(run_mocha,
            args=(self.connection_url, self.token, terminals_available))
        super(TestApp, self).start()


if __name__ == '__main__':
    TestApp.launch_instance()
