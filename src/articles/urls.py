#!/usr/bin/env python
# -*- coding:utf-8 -*-
from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^article', views.ArticleListView.as_view(), name='article_list'),
    url(r'^news', views.NewsListView.as_view(), name='news_list'),
]


