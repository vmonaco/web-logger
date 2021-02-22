import os

DEBUG = True
TEMPLATES_AUTO_RELOAD = True

# BACKUP_DIR = '/tmp/web-logger'
ROOT_DIR = os.path.join(os.path.expanduser('~'), 'Dropbox', 'web-logger')
ROOT_DIR = os.path.dirname(os.path.realpath(__file__))
DATA_DIR = os.path.join(ROOT_DIR, 'data')

# Headers for data CSV files
EVENT_HEADERS = {
    'metadata':'field,value',
    'event':'event,time,date_time,performance_time',
    'keystroke':'timepress,timerelease,keycode,keyname,target,selectionstartpress,selectionendpress,selectionstartrelease,selectionendrelease',
    'mousemotion':'time,x,y,xpage,ypage,xtarget,ytarget,targetwidth,targetheight,dragged,target',
    'mouseclick':'timepress,timerelease,button,xpress,ypress,xoffsetpress,yoffsetpress,targetwidthpress,targetheightpress,targetpress,selectionstartpress,selectionendpress,xrelease,yrelease,xoffsetrelease,yoffsetrelease,targetwidthrelease,targetheightrelease,targetrelease,selectionstartrelease,selectionendrelease',
    'mousescroll':'time,xdelta,ydelta,deltamode,deltafactor,x,y,xpage,ypage,xtarget,ytarget,targetwidth,targetheight,target',
    'response':'question,response',
}

# How often to flush logged events
FLUSH_DELAY = 2000
