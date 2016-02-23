#!/usr/bin/env python
# -*- coding:utf-8 -*-

import logging

import requests
from bs4 import BeautifulSoup
from articles.models import News
from dateutil import parser

def save_latest_jianshu_news():
    news_list = get_latest_jianshu_news()
    for news in news_list:
        if not News.objects.filter(url=news.url).exists():
            news.save()

def get_latest_jianshu_news():
    headers = {
        'Referer': 'http://www.jianshu.com/collection/NEt52a',
        'X-INFISCROLL': 'true', 'X-Requested-With': 'XMLHttpRequest'
    }
    url = "http://www.jianshu.com/collections/16/notes?order_by=added_at&page=1"
    response = requests.get(url, headers=headers)
    news_list = []
    if response.status_code == 200:
        soup = BeautifulSoup(response.text)
        for li in soup.find_all("li"):
            try:
                h4 = li.find("h4", {"class": "title"})
                title = h4.find("a").text
                link = h4.find("a").attrs.get("href")
                pub_time = li.find("span", {"class": "time"}).attrs.get("data-shared-at")
                news = News(
                    title=title.encode("utf-8"),
                    url="http://www.jianshu.com" + link,
                    summary="",
                    pub_time=parser.parse(pub_time),
                    news_from=4,
                )
                logging.info(news)
                news_list.append(news)
            except Exception, e:
                logging.error(e)

    return news_list