import os
import sys
import csv
import json
from datetime import datetime
from flask import Flask, render_template, request, url_for, redirect, jsonify, make_response

DATA_DIR = os.path.join(os.path.expanduser('~'), 'Dropbox', 'weblogger-data')

EVENT_HEADERS = {
    'events':'event,time,date_time,performance_time,x,y,z',
    'metadata':'field,value',
}

for event_type in EVENT_HEADERS.keys():
    os.makedirs(os.path.join(DATA_DIR, event_type), exist_ok=True)

# How often to flush logged events
FLUSH_DELAY = 2000

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


def append_events(id, event_type, events):
    fname = os.path.join(DATA_DIR, event_type, id + '.csv')

    if os.path.exists(fname):
        with open(fname, 'a') as f:
            f.write('\n' + events)
    else:
        print('Created file:', fname)

        with open(fname, 'w') as f:
            f.write(EVENT_HEADERS[event_type] + '\n')
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
        n += append_events(id, type, request.get_data(as_text=True))
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
