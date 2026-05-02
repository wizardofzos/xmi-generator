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

_MAGIC_HINT = (
    "Error: libmagic not found.\n"
    "Install it with:\n"
    "  macOS:   brew install libmagic\n"
    "  Ubuntu:  sudo apt install libmagic1\n"
    "  Fedora:  sudo dnf install file-libs\n"
    "  Windows: pip install python-magic-bin\n"
)

if __name__ == '__main__':
    try:
        extract_main()
    except Exception as e:
        msg = str(e).lower()
        if any(s in msg for s in ('magic', 'libmagic', 'magic files')):
            sys.stderr.write(_MAGIC_HINT)
            sys.exit(1)
        raise
