# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from __future__ import print_function, absolute_import

import atexit
import sys
import os
import shutil
import tempfile

from tornado.ioloop import IOLoop
from tornado.process import Subprocess
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


def run_command(cmd):
    """Run a task in a thread and exit with the return code."""
    shell = os.name == 'nt'
    p = Subprocess(cmd, shell=shell)
    print('\n\nRunning command: "%s"\n\n' % ' '.join(cmd))
    p.set_exit_callback(sys.exit)


def get_command(nbapp):
    """Get the command to run"""
    terminalsAvailable = nbapp.web_app.settings['terminals_available']
    # Compatibility with Notebook 4.2.
    token = getattr(nbapp, 'token', '')
    cmd = ['mocha', '--timeout', '20000',
           '--retries', '2',
           'build/integration.js',
           '--baseUrl=%s' % nbapp.connection_url,
           '--terminalsAvailable=%s' % terminalsAvailable]
    if nbapp.token:
        cmd.append('--token=%s' % token)
    return cmd


class TestApp(NotebookApp):
    """A notebook app that runs a mocha test."""

    open_browser = Bool(False)
    notebook_dir = Unicode(create_notebook_dir())

    def start(self):
        # Cannot run against Notebook 4.3.0 due to auth incompatibilities.
        if self.version == '4.3.0':
            msg = ('Cannot run unit tests against Notebook 4.3.0.  '
                   'Please upgrade to Notebook 4.3.1+')
            self.log.error(msg)
            sys.exit(1)

        cmd = get_command(self)
        IOLoop.current().add_callback(run_command, cmd)
        super(TestApp, self).start()


if __name__ == '__main__':
    try:
        TestApp.launch_instance()
    except KeyboardInterrupt:
        sys.exit(1)
