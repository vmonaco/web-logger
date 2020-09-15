import os
import sys
import csv
import json
from datetime import datetime
from flask import Flask, render_template, request, url_for, redirect, jsonify, make_response


def create_app():
    app = Flask(__name__)
    app.config.from_object('config')

    import survey
    survey.init_app(app, url_prefix='/survey')

    return app

app = create_app()

def append_events(id, event_type, request, basedir=app.config['DATA_DIR']):
    events = request.get_data(as_text=True)

    if len(events) == 0:
        return 0

    outdir = os.path.join(basedir, id)
    fname = os.path.join(outdir, event_type + '.csv')

    os.makedirs(outdir, exist_ok=True)

    if os.path.exists(fname):
        with open(fname, 'a') as f:
            f.write('\n' + events)
    else:
        print('Created file:', fname)

        with open(fname, 'w') as f:
            f.write(app.config['EVENT_HEADERS'][event_type] + '\n')

            if event_type=='metadata':
                events += '\nip,%s\nport,%s' %(request.environ['REMOTE_ADDR'], request.environ.get('REMOTE_PORT'))

            f.write(events)

    num_events = events.count('\n') + 1
    return num_events


@app.after_request
def add_header(r):
    r.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    r.headers['Pragma'] = 'no-cache'
    r.headers['Expires'] = '0'
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r


@app.route('/enroll', methods=['POST'])
def enroll():
    id = request.args.get('id')
    type = request.args.get('type')
    n = 0
    if type in app.config['EVENT_HEADERS'].keys():
        n += append_events(id, type, request, basedir=app.config['DATA_DIR'])
        append_events(id, type, request, basedir=app.config['BACKUP_DIR'])

    return 'Saved %d event(s)' % n


@app.route('/')
def index():
    # generate a unique session id
    id = datetime.utcnow().strftime('%Y%m%d%H%M%S.%f')
    # enroll_url = url_for('enroll', id=id, _external=True)
    # print(enroll_url)
    resp = make_response(render_template('index.html', session_id=id))
    return resp


if __name__ == '__main__':
    app.run(host='0.0.0.0')
