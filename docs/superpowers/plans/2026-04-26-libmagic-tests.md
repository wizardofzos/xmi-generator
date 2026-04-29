# libmagic Fix + Tests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `libmagic` import error on machines without it installed, add a clear per-platform error message, and add Python tests covering import health and a create/extract round-trip.

**Architecture:** `python-magic-bin` is installed after `xmi-reader` in `install-python` (provides bundled libmagic on Windows + macOS Intel; silently skipped elsewhere). Both Python wrappers gain a `try/except ImportError` block that prints a clear platform-specific install hint. A `tests/test_wrappers.py` pytest file covers import success, createxmi round-trip, and extractxmi round-trip.

**Tech Stack:** Python 3, pytest, xmi-reader 1.0.1, python-magic-bin 0.4.14, Node.js/pnpm

---

### Task 1: Update install-python script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Read current package.json**

Read `/Users/henri/repos/xmi-generator/package.json` to see current `install-python` script.

- [ ] **Step 2: Update the install-python script**

Change `"install-python"` to install `python-magic-bin` after `xmi-reader`, ignoring failure (it has no wheel for Linux or macOS arm64):

```json
"install-python": "python3 -m pip install xmi-reader==1.0.1 --target ./python/lib --upgrade -q && (python3 -m pip install python-magic-bin==0.4.14 --target ./python/lib --upgrade -q || true)"
```

- [ ] **Step 3: Run it and verify**

```bash
cd /Users/henri/repos/xmi-generator && pnpm run install-python
```

Expected: completes without error. Check `python/lib/` — on macOS Intel/Windows you'll see updated `magic/` files; on macOS arm64 the `|| true` swallows the failure silently.

- [ ] **Step 4: Verify JSON is valid**

```bash
node -e "require('./package.json'); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "fix: install python-magic-bin to bundle libmagic where available"
```

---

### Task 2: Add ImportError handling to Python wrappers

**Files:**
- Modify: `python/run_createxmi.py`
- Modify: `python/run_extractxmi.py`

- [ ] **Step 1: Replace python/run_createxmi.py**

```python
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lib'))

try:
    from xmi.cli import create_main
except ImportError as e:
    if 'magic' in str(e).lower() or 'libmagic' in str(e).lower():
        sys.stderr.write(
            "Error: libmagic not found.\n"
            "Install it with:\n"
            "  macOS:   brew install libmagic\n"
            "  Ubuntu:  sudo apt install libmagic1\n"
            "  Fedora:  sudo dnf install file-libs\n"
            "  Windows: pip install python-magic-bin\n"
        )
        sys.exit(1)
    raise

if __name__ == '__main__':
    create_main()
```

- [ ] **Step 2: Replace python/run_extractxmi.py**

```python
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lib'))

try:
    from xmi.cli import extract_main
except ImportError as e:
    if 'magic' in str(e).lower() or 'libmagic' in str(e).lower():
        sys.stderr.write(
            "Error: libmagic not found.\n"
            "Install it with:\n"
            "  macOS:   brew install libmagic\n"
            "  Ubuntu:  sudo apt install libmagic1\n"
            "  Fedora:  sudo dnf install file-libs\n"
            "  Windows: pip install python-magic-bin\n"
        )
        sys.exit(1)
    raise

if __name__ == '__main__':
    extract_main()
```

- [ ] **Step 3: Verify both still work**

```bash
cd /Users/henri/repos/xmi-generator
python3 python/run_createxmi.py --help 2>&1 | head -3
python3 python/run_extractxmi.py --help 2>&1 | head -3
```

Expected: usage lines, no errors.

- [ ] **Step 4: Commit**

```bash
git add python/run_createxmi.py python/run_extractxmi.py
git commit -m "fix: show actionable libmagic install hint on ImportError"
```

---

### Task 3: Add Python tests

**Files:**
- Create: `tests/__init__.py`
- Create: `tests/test_wrappers.py`

- [ ] **Step 1: Install pytest into the dev environment**

```bash
pip3 install pytest --break-system-packages 2>/dev/null || python3 -m pip install pytest --user
```

Expected: pytest installed. Verify: `python3 -m pytest --version`

- [ ] **Step 2: Create tests/__init__.py (empty)**

Create an empty file at `/Users/henri/repos/xmi-generator/tests/__init__.py`.

- [ ] **Step 3: Create tests/test_wrappers.py**

```python
"""
Tests for the XMI Generator VSCode extension Python wrappers.
Runs against python/lib/ — requires 'pnpm run install-python' first.
"""
import subprocess
import sys
import os
import tempfile
import shutil
import pytest

PYTHON = sys.executable
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREATE_SCRIPT = os.path.join(REPO, 'python', 'run_createxmi.py')
EXTRACT_SCRIPT = os.path.join(REPO, 'python', 'run_extractxmi.py')


def run(script, args):
    return subprocess.run(
        [PYTHON, script] + args,
        capture_output=True, text=True
    )


class TestImports:
    def test_createxmi_imports_cleanly(self):
        result = run(CREATE_SCRIPT, ['--help'])
        assert result.returncode == 0, f"stderr: {result.stderr}"

    def test_extractxmi_imports_cleanly(self):
        result = run(EXTRACT_SCRIPT, ['--help'])
        assert result.returncode == 0, f"stderr: {result.stderr}"

    def test_createxmi_help_mentions_dsn(self):
        result = run(CREATE_SCRIPT, ['--help'])
        assert '--dsn' in result.stdout

    def test_extractxmi_help_mentions_outputdir(self):
        result = run(EXTRACT_SCRIPT, ['--help'])
        assert '--outputdir' in result.stdout


class TestCreateRoundtrip:
    def setup_method(self):
        self.workdir = tempfile.mkdtemp()

    def teardown_method(self):
        shutil.rmtree(self.workdir, ignore_errors=True)

    def test_create_xmi_from_file(self):
        # Create a source file
        src = os.path.join(self.workdir, 'hello.jcl')
        with open(src, 'w') as f:
            f.write('//HELLO JOB\n')

        out = os.path.join(self.workdir, 'hello.XMI')
        result = run(CREATE_SCRIPT, [src, '-o', out, '--dsn', 'MY.JCL'])

        assert result.returncode == 0, f"stderr: {result.stderr}"
        assert os.path.exists(out), "XMI file was not created"
        assert os.path.getsize(out) > 0, "XMI file is empty"

    def test_create_xmi_from_folder(self):
        # Create a source folder with two members
        src_dir = os.path.join(self.workdir, 'mypds')
        os.makedirs(src_dir)
        with open(os.path.join(src_dir, 'MEMBER1'), 'w') as f:
            f.write('//MEMBER1 JOB\n')
        with open(os.path.join(src_dir, 'MEMBER2'), 'w') as f:
            f.write('//MEMBER2 JOB\n')

        out = os.path.join(self.workdir, 'mypds.XMI')
        result = run(CREATE_SCRIPT, [src_dir, '-o', out, '--dsn', 'MY.PDS'])

        assert result.returncode == 0, f"stderr: {result.stderr}"
        assert os.path.exists(out), "XMI file was not created"
        assert os.path.getsize(out) > 0, "XMI file is empty"


class TestExtractRoundtrip:
    def setup_method(self):
        self.workdir = tempfile.mkdtemp()

    def teardown_method(self):
        shutil.rmtree(self.workdir, ignore_errors=True)

    def _make_xmi(self, name='test'):
        src_dir = os.path.join(self.workdir, name)
        os.makedirs(src_dir)
        with open(os.path.join(src_dir, 'HELLO'), 'w') as f:
            f.write('hello from mainframe\n')
        out = os.path.join(self.workdir, f'{name}.XMI')
        result = run(CREATE_SCRIPT, [src_dir, '-o', out, '--dsn', f'{name.upper()}.PDS'])
        assert result.returncode == 0, f"createxmi failed: {result.stderr}"
        return out

    def test_list_contents(self):
        xmi_file = self._make_xmi()
        result = run(EXTRACT_SCRIPT, ['-l', xmi_file])
        assert result.returncode == 0, f"stderr: {result.stderr}"
        assert len(result.stdout.strip()) > 0, "listing was empty"

    def test_extract_creates_files(self):
        xmi_file = self._make_xmi()
        out_dir = os.path.join(self.workdir, 'extracted')
        os.makedirs(out_dir)
        result = run(EXTRACT_SCRIPT, [xmi_file, '--outputdir', out_dir, '-q'])
        assert result.returncode == 0, f"stderr: {result.stderr}"
        extracted = []
        for root, _, files in os.walk(out_dir):
            extracted.extend(files)
        assert len(extracted) > 0, "no files were extracted"
```

- [ ] **Step 4: Run the tests**

```bash
cd /Users/henri/repos/xmi-generator && python3 -m pytest tests/ -v
```

Expected: all tests pass. If any fail, investigate and fix before committing.

- [ ] **Step 5: Add tests to .vscodeignore**

Read `.vscodeignore` then append:
```
tests/**
```

- [ ] **Step 6: Commit**

```bash
git add tests/ .vscodeignore
git commit -m "test: add Python wrapper import and round-trip tests"
```

---

### Task 4: Bump version to 0.0.4 and update docs

**Files:**
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Bump version in package.json**

Change `"version": "0.0.3"` to `"version": "0.0.4"`.

- [ ] **Step 2: Add release note to README.md**

In the Release Notes section, add above `### 0.0.3`:

```markdown
### 0.0.4

Fixed `libmagic` error on machines without it installed — bundled `python-magic-bin` where available and added a clear per-platform install hint for all other systems.
```

- [ ] **Step 3: Commit and push**

```bash
git add package.json README.md
git commit -m "chore: bump to 0.0.4"
git push
```
