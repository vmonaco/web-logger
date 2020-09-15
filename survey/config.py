import os

curdir = os.path.abspath(os.path.dirname(__file__))

SURVEY_DIR = os.path.join(curdir, 'surveys')
SURVEY_SUBMISSIONS_DIR = os.path.join(curdir, 'submissions')

root_data_dir = curdir
SURVEY_DATA_DIR = os.path.join(root_data_dir, 'survey-data')

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
