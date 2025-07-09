conda create -n try_adk_venv python=3.13
which python
which pip
python3.13 -m venv try_adk_venv
source try_adk_venv/bin/activate

(try_adk_venv) % which pip
/opt/homebrew/bin/pip
(try_adk_venv) % source try_adk_venv/bin/activate

(try_adk_venv) (try_adk_venv) % which pip

/path_to_todos_2/try_adk_venv/bin/pip

pip install -r requirements.txt
