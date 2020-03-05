import os
import sys
import csv
import json
from datetime import datetime
from flask import Flask, render_template, request, url_for, redirect, jsonify, make_response

DATA_DIR = os.path.join(os.path.expanduser('~'), 'Dropbox', 'weblogger-data')
BACKUP_DIR = '/tmp/weblogger-data'

EVENT_HEADERS = {
    'events':'event,time,date_time,performance_time,x,y,z',
    'metadata':'field,value',
}

# How often to flush logged events
FLUSH_DELAY = 2000

app = Flask(__name__)


def append_events(id, event_type, request, basedir=DATA_DIR):
    events = request.get_data(as_text=True)

    if len(events) == 0:
        return 0

    outdir = os.path.join(basedir, event_type)
    fname = os.path.join(outdir, id + '.csv')

    os.makedirs(outdir, exist_ok=True)

    if os.path.exists(fname):
        with open(fname, 'a') as f:
            f.write('\n' + events)
    else:
        print('Created file:', fname)

        with open(fname, 'w') as f:
            f.write(EVENT_HEADERS[event_type] + '\n')

            if event_type=='metadata':
                events += '\nip,%s\nport,%s' %(request.environ['REMOTE_ADDR'], request.environ.get('REMOTE_PORT'))

            f.write(events)

    num_events = events.count('\n') + 1
    return num_events


@app.after_request
def add_header(r):
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r


@app.route("/events", methods=['POST'])
def events():
    id = request.args.get('id')
    type = request.args.get('type')
    n = 0
    if type in EVENT_HEADERS.keys():
        n += append_events(id, type, request, outdir=DATA_DIR)
        n += append_events(id, type, request, outdir=BACKUP_DIR)
    return 'Saved %d event(s)' % n


@app.route("/")
def index():
    id = datetime.utcnow().strftime('%Y%m%d%H%M%S.%f')
    events_url = url_for('events', id=id, _external=True)
    print(events_url)
    resp = make_response(render_template('index.html', events_url=events_url, flush_delay=FLUSH_DELAY))
    return resp


if __name__ == "__main__":
    app.run(host='0.0.0.0')
