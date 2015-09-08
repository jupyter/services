
To run this example, run the build command and start a Notebook server from this directory:

```bash
npm run build:example
jupyter notebook
```

Then, run this cell in a notebook:

```python
from IPython.display import display_javascript
with open('bundle.js') as fid:
    display_javascript(fid.read(), raw=True)
```
