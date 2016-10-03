import atexit
import os
import tempfile

from notebook.services.contents.filemanager import FileContentsManager


# Set up the file structure
root_dir = tempfile.mkdtemp(prefix='mock_contents')
os.mkdir(os.path.join(root_dir, 'src'))
with open(os.path.join(root_dir, 'src', 'temp.txt'), 'w') as fid:
    fid.write('hello')

atexit.register(lambda: os.removedirs(root_dir))


class MockContentsManager(FileContentsManager):

    root_dir = root_dir
