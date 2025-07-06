import logging
from logging.config import dictConfig


def setup_logging() -> None:
    dictConfig(
        {
            "version": 1,
            "formatters": {
                "default": {"format": "%(levelname)s | %(name)s | %(message)s"}
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                }
            },
            "root": {"handlers": ["default"], "level": "INFO"},
        }
    )


setup_logging()
