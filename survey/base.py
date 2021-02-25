import os
import sys
import csv
import json
import copy
from datetime import datetime
from flask import Flask, render_template, request, url_for, redirect, jsonify, make_response, Blueprint, abort, current_app

survey_bp = Blueprint('survey', __name__, template_folder='templates')

SURVEY_DEFAULTS = {
    "submit": "Submit",
    "messages": {
        "error": {
            "required": "Field is required",
            "invalid": "Invalid value"
        },
        "success": "Thank you! Your form has been submitted!"
    }
}


def new_session():
    session = datetime.utcnow().strftime('survey-%Y%m%d%H%M%S') # + 8 random chars
    return session


def load_session(session):
    sfile = os.path.join(_get_option('DATA_DIR'), session, 'info.json')

    if os.path.exists(sfile):
        with open(sfile) as f:
            data = json.load(f)
        return data

    return None


def save_session(session_data):
    sdir = os.path.join(_get_option('DATA_DIR'), session_data['session_id'])
    os.makedirs(sdir, exist_ok=True)

    sfile = os.path.join(sdir, 'info.json')
    with open(sfile, 'w') as f:
        json.dump(session_data, f, indent=4)


def start_or_load_session(slug, session):
    sdir = os.path.join(_get_option('DATA_DIR'), session)
    os.makedirs(sdir, exist_ok=True)

    sfile = os.path.join(sdir, 'info.json')
    if os.path.exists(sfile):
        session_data = load_session(session)
    else:
        # create the session
        session_data = {
            'session_id': session,
            'survey': slug,
            'next_question': 0,
            'ip_addr': '',
        }
        save_session(session_data)

    return session_data


def _merge_objects(obj1, obj2):
    """Recursive merge obj2 into obj1. Objects can be dicts and lists."""
    if type(obj1) == list:
        obj1.extend(obj2)
        return obj1
    for k2, v2 in obj2.items():
        v1 = obj1.get(k2)
        if type(v2) == type(v1) in (dict, list):
            _merge_objects(v1, v2)
        else:
            obj1[k2] = v2
    return obj1


def _get_option(opt, val=None):
    opt = 'SURVEY_' + opt
    try:
        val = current_app.config[opt]
    except KeyError:
        if val is None:
            abort(500, "%s is not configured" % opt)
    return val


def _get_defaults():
    return _merge_objects(copy.deepcopy(SURVEY_DEFAULTS),
                          _get_option('DEFAULTS', {}))

def _post_process_data(data):
    for q in data.get('questions', []):
        # find and index "other" options
        if 'options' in q:
            for i, o in enumerate(q['options']):
                if o.startswith('+'):
                    if 'other_option' in q:
                        abort(500, "only one \"other\" option per question is "
                              "allowed: %s" % o)
                    q['options'][i] = q['other_option'] = o[1:]
    return data


def __get_survey_data(slug):
    """Read questionnaire data from the file pointed by slug."""
    qfile = os.path.join(_get_option('DIR'), slug + '.json')
    try:
        with open(qfile) as f:
            data = json.load(f)
            if not isinstance(data, dict):
                raise ValueError('json top level structure must be object')
    except (TypeError, ValueError, OverflowError) as e:
        current_app.logger.exception('parse error: %s: %s', qfile, e)
        abort(500, "error in %s" % slug)
    except EnvironmentError as e:
        current_app.logger.info('I/O error: %s: %s', qfile, e)
        abort(404, "Questionnaire not found: %s" % slug)
    if 'extends' in data:
        data = _merge_objects(__get_questionnaire_data(data['extends']), data)
    else:
        data = _merge_objects(_get_defaults(), data)
    return data


def _get_survey_data(slug):
    return _post_process_data(__get_survey_data(slug))


@survey_bp.route('/<slug>', methods=['GET', 'POST'])
def survey(slug):
    # get the survey questions
    survey_data = _get_survey_data(slug)

    # try loading the session, only exists if user began the survey
    session = request.cookies.get('sessionID')
    if not session:
        session = request.form.get('sessionID')

    # if no session, show the landing page
    if not session:
        session = new_session()
        resp = make_response(render_template('start.html', session_id=session, slug=slug, survey_data=survey_data))
        return resp

    # user consented to survey, start or continue the session
    session_data = start_or_load_session(slug, session)

    next_question = session_data['next_question']

    # survey response submitted
    if request.method == 'POST':
        print('posted')
        print(request.form)
        # log the response

        # update the session
        session_data['next_question'] += 1
        save_session(session_data)

    # TODO: Make sure the current session matches what was saved.
    # This ensures users complete one survey before starting another
    if session_data['survey'] != slug:
        # redirect to the correct slug
        return make_response(render_template('start.html', session_id=session, slug=correct_slug, survey_data=survey_data))

    # last question submitted, finish and clear the sessionID cookie
    if session_data['next_question'] >= len(survey_data['questions']):
        resp = make_response(render_template('finish.html', session_id=session, slug=slug))
        resp.set_cookie('sessionID', '', expires=0)
        return resp

    # render the next question
    resp = make_response(render_template('question.html', session_id=session, slug=slug, survey_data=survey_data, session_data=session_data, q=survey_data['questions'][next_question], question_id=next_question))
    resp.set_cookie('sessionID', session)
    return resp
