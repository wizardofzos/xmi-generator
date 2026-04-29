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
