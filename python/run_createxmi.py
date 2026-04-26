import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lib'))
from xmi.cli import create_main
if __name__ == '__main__':
    create_main()
