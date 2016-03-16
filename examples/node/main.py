"""
Copyright (c) Jupyter Development Team.
Distributed under the terms of the Modified BSD License.
"""
import re
import subprocess
import sys
import threading

PORT = 8765


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

    # Run the node script with command arguments.
    node_command = ['node', 'index.js', '-baseUrl', base_url]
    node_proc = subprocess.Popen(node_command, stderr=subprocess.STDOUT,
                                 stdout=subprocess.PIPE)

    while 1:
        line = node_proc.stdout.readline().decode('utf-8').strip()
        if not line:
            continue
        print(line)
        if 'Session shut down' in line:
            break

    node_proc.wait()
    nb_server.kill()

if __name__ == '__main__':
    main()
