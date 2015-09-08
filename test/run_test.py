# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import subprocess
import sys
import argparse

KARMA_PORT = 9876

argparser = argparse.ArgumentParser(
        description='Run Jupyter JS Sevices integration tests'
    )
argparser.add_argument('-b', '--browsers', default='Firefox',
                       help="Browsers to use for Karma test")
options = argparser.parse_args(sys.argv[1:])

nb_command = [sys.executable, '-m', 'notebook', '--no-browser',
              '--NotebookApp.allow_origin="http://localhost:%s"' % KARMA_PORT]
nb_server = subprocess.Popen(nb_command, stderr=subprocess.STDOUT)

karma_command = ['karma', 'start', '--browsers=' + options.browsers,
                 'karma.conf.js', '--port=%s' % KARMA_PORT]
try:
    resp = subprocess.check_call(karma_command, stderr=subprocess.STDOUT)
except subprocess.CalledProcessError:
    pass
finally:
    nb_server.kill()
