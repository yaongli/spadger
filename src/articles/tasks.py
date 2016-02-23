#!/usr/bin/env python
# -*- coding:utf-8 -*-

from celery.task.schedules import crontab
from celery.decorators import periodic_task
from celery.utils.log import get_task_logger

from articles.jianshu import save_latest_jianshu_news

logger = get_task_logger(__name__)

@periodic_task(
    run_every=(crontab(minute='*/5')),
    name="task_save_latest_jianshu_news",
    ignore_result=True
)
def task_save_latest_jianshu_news():
    """
    Saves latest image from Flickr
    """
    save_latest_jianshu_news()
    logger.info("Saved lastest news from Jianshu")
