# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import subprocess
import sys
import argparse
import threading

KARMA_PORT = 9876


def start_notebook():
    nb_command = [sys.executable, '-m', 'notebook', '--no-browser',
                  '--debug', '--NotebookApp.allow_origin="*"']
    nb_server = subprocess.Popen(nb_command, stderr=subprocess.STDOUT,
                                 stdout=subprocess.PIPE)

    # wait for notebook server to start up
    while 1:
        line = nb_server.stdout.readline().decode('utf-8').strip()
        if not line:
            continue
        print(line)
        if 'Jupyter Notebook is running at:' in line:
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

    return nb_server


def run_karma(options):
    if options.debug:
        options.browsers = 'Chrome'
    karma_command = ['karma', 'start', '--browsers=' + options.browsers,
                     'karma-integration.conf.js', '--port=%s' % KARMA_PORT]
    if options.debug:
        karma_command += ['--singleRun=false', '--debug=true']
    print(' '.join(karma_command))
    return subprocess.check_call(karma_command, stderr=subprocess.STDOUT)


if __name__ == '__main__':
    argparser = argparse.ArgumentParser(
        description='Run Jupyter JS Sevices integration tests'
    )
    argparser.add_argument('-b', '--browsers', default='Firefox',
                           help="Browsers to use for Karma test")
    argparser.add_argument('-d', '--debug', action='store_true',
                           help="Whether to enter debug mode in Karma")
    options = argparser.parse_args(sys.argv[1:])

    nb_server = start_notebook()

    try:
        resp = run_karma(options)
    except subprocess.CalledProcessError:
        resp = 1
    finally:
        nb_server.kill()

    sys.exit(resp)
