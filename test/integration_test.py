# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import argparse
import subprocess
import sys
import os
import re
import shutil
import threading
import tempfile


# Set up the file structure
root_dir = tempfile.mkdtemp(prefix='mock_contents')
os.mkdir(os.path.join(root_dir, 'src'))
with open(os.path.join(root_dir, 'src', 'temp.txt'), 'w') as fid:
    fid.write('hello')


KARMA_PORT = 9876



def start_notebook():
    nb_command = [sys.executable, '-m', 'notebook', root_dir, '--no-browser',
                  '--debug',
                  # FIXME: allow-origin=* only required for notebook < 4.3
                  '--NotebookApp.allow_origin="*"',
                  # disable user password:
                  '--NotebookApp.password=',
              ]
    nb_server = subprocess.Popen(nb_command, stderr=subprocess.STDOUT,
                                 stdout=subprocess.PIPE)

    # wait for notebook server to start up
    while 1:
        line = nb_server.stdout.readline().decode('utf-8').strip()
        if not line:
            continue
        print(line)
        if 'Jupyter Notebook is running at:' in line:
            base_url = re.search(r'(http[^\?]+)', line).groups()[0]
            token_match = re.search(r'token\=([^&]+)', line)
            if token_match:
                token = token_match.groups()[0]
            else:
                token = ''
            break

    while 1:
        line = nb_server.stdout.readline().decode('utf-8').strip()
        if not line:
            continue
        print(line)
        if 'Control-C' in line:
            break

    def print_thread():
        while 1:
            line = nb_server.stdout.readline().decode('utf-8').strip()
            if not line:
                continue
            print(line)

    thread = threading.Thread(target=print_thread)
    thread.setDaemon(True)
    thread.start()

    return nb_server, base_url, token


def run_mocha(options, base_url, token):
    mocha_command = ['mocha', '--timeout', '20000', 'build/integration.js',
                     '--baseUrl=%s' % base_url, '--token=%s' % token]
    return subprocess.check_call(mocha_command, stderr=subprocess.STDOUT)


if __name__ == '__main__':
    argparser = argparse.ArgumentParser(
        description='Run Jupyter JS Sevices integration tests'
    )
    argparser.add_argument('-b', '--browsers', default='Firefox',
                           help="Browsers to use for Karma test")
    argparser.add_argument('-d', '--debug', action='store_true',
                           help="Whether to enter debug mode in Karma")
    options = argparser.parse_args(sys.argv[1:])

    nb_server, base_url, token = start_notebook()

    try:
        resp = run_mocha(options, base_url, token)
    except subprocess.CalledProcessError:
        resp = 1
    finally:
        nb_server.kill()

    shutil.rmtree(root_dir, True)
    sys.exit(resp)
