
from .base import survey_bp

def init_app(app, url_prefix=None):
    app.register_blueprint(survey_bp, url_prefix=url_prefix)
    app.config.from_object('survey.config')
