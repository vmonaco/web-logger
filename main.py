import os
import sys
import csv
import json
from datetime import datetime
from flask import Flask, render_template, request, url_for, redirect, jsonify, make_response

THIS_DIR = os.path.dirname(os.path.realpath(__file__))
ROOT_DIR = os.path.join(THIS_DIR, '..')
DATA_DIR = os.path.join(ROOT_DIR, 'data')

SESSIONS_FNAME = 'sessions'
METADATA_FNAME = 'metadata'
METADATA_HEADER = 'id,session,task,date,useragent'

# How often clients should flush logged events
FLUSH_DELAY = 2000

# Headers for data CSV files
EVENT_HEADERS = {
    'messages':'time,message,response',
    'keystroke':'timepress,timerelease,keycode,keyname,target,selectionstartpress,selectionendpress,selectionstartrelease,selectionendrelease',
    'mousemotion':'time,x,y,xpage,ypage,xtarget,ytarget,targetwidth,targetheight,dragged,target',
    'mouseclick':'timepress,timerelease,button,xpress,ypress,xoffsetpress,yoffsetpress,targetwidthpress,targetheightpress,targetpress,selectionstartpress,selectionendpress,xrelease,yrelease,xoffsetrelease,yoffsetrelease,targetwidthrelease,targetheightrelease,targetrelease,selectionstartrelease,selectionendrelease',
    'mousescroll':'time,xdelta,ydelta,deltamode,deltafactor,x,y,xpage,ypage,xtarget,ytarget,targetwidth,targetheight,target'
}

app = Flask(__name__)


def lookup_session(session):
    fname = os.path.join(DATA_DIR, SESSIONS_FNAME + '.csv')
    templates = {}
    with open(fname, mode='r') as f:
        reader = csv.reader(f)
        for row in reader:
            templates[row[1]] = {'login':row[2],'chat':row[3]}

    if session in templates.keys():
        return templates[session]
    else:
        return None


def append_events(id, event_type, events):
    os.makedirs(os.path.join(DATA_DIR, event_type), exist_ok=True)
    fname = os.path.join(DATA_DIR, event_type, id + '.csv')

    if os.path.exists(fname):
        # Append to an existing capture file
        with open(fname, 'a') as f:
            f.write('\n' + events)
    else:
        print('Created file:', fname)

        # Create a new capture file
        with open(fname, 'w') as f:
            f.write(EVENT_HEADERS[event_type] + '\n')
            f.write(events)

    num_events = events.count('\n') + 1
    return num_events


def save_meta(id, task, session, timenow, useragent):
    fname = os.path.join(DATA_DIR, METADATA_FNAME + '.csv')

    if os.path.exists(fname):
        with open(fname, 'r') as f:
            for line in f.readlines():
                if id in line.strip().split(','):
                    return

        with open(fname, 'a') as f:
            f.write('\n%s,%s,%s,%s,"%s"' % (id, session, task, timenow, useragent))
    else:
        print('Created file:', fname)

        # Create a new capture file
        with open(fname, 'w') as f:
            f.write(METADATA_HEADER)
            f.write('\n%s,%s,%s,%s,"%s"' % (id, session, task, timenow, useragent))


@app.route("/enroll", methods=['POST'])
def enroll():
    # Get the user ID
    id = request.args.get('id')

    num_enrolled = 0
    for event_type in EVENT_HEADERS.keys():
        if event_type in request.form.keys():
            n = append_events(id, event_type, request.form[event_type])
            num_enrolled += n

    return 'Enrolled %d event(s)' % n


@app.route("/metadata", methods=['POST'])
def metadata():
    # Get the user ID
    id = request.args.get('id')

    num_enrolled = 0
    for event_type in request.form.keys():
        n = append_metadata(id, metedata_type, request.form[meteadata_type])
        num_enrolled += n

    return 'Enrolled %d metadata' % n


@app.route("/tmp",  methods=['GET','POST'])
def index():
    timenow = datetime.utcnow()
    fname = timenow.strftime('%Y%m%d%H%M%S.%f')
    enroll_url = url_for('enroll', id=fname)
    resp = make_response(render_template('index.html', enroll_url=enroll_url, flush_delay=FLUSH_DELAY))
    return resp


@app.route("/")
def hello():
    return "<h1 style='color:blue'>Hello There!</h1>"


if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    app.run(host='0.0.0.0')
