
To run this example, start a Notebook server from this directory:

```bash
jupyter notebook
```

Then, run this cell in a notebook:

```python
from IPython.display import display_javascript
with open('bundle.js') as fid:
    display_javascript(fid.read(), raw=True)
```
