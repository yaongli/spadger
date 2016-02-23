#!/usr/bin/env python
# -*- coding:utf-8 -*-

from __future__ import unicode_literals
from django.shortcuts import render
from django.views.generic import View,TemplateView,ListView,DetailView
from django.shortcuts import get_object_or_404, redirect, get_list_or_404
from django.contrib import messages
from braces.views import LoginRequiredMixin
from profiles.models import Profile
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import *

PAGE_NUM = 10

class ArticleListView(LoginRequiredMixin, ListView):
    template_name = "articles/article_list.html"
    context_object_name = 'article_list'
    paginate_by = PAGE_NUM
    http_method_names = ['get']

    def get_queryset(self):
        article_list = Article.objects.order_by("-pub_time")
        return article_list


class NewsListView(ListView):
    template_name = "articles/news_list.html"
    context_object_name = 'news_list'
    paginate_by = PAGE_NUM
    http_method_names = ['get']

    def get_queryset(self):
        article_list = News.objects.order_by("-pub_time")
        return article_list
