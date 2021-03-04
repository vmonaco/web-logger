import os

DEBUG = True
TEMPLATES_AUTO_RELOAD = True

BACKUP_DIR = '/tmp/web-logger'
ROOT_DIR = os.path.join(os.path.expanduser('~'), 'Dropbox', 'web-logger')
# ROOT_DIR = os.path.dirname(os.path.realpath(__file__))
DATA_DIR = os.path.join(ROOT_DIR, 'data')

# Headers for data CSV files
EVENT_HEADERS = {
    'metadata':'field,value',
    'event':'event,question,time,date_time,performance_time,x,y,z,id',
}

# How often to flush logged events
FLUSH_DELAY = 2000
