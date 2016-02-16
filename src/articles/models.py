#!/usr/bin/env python
# -*- coding:utf-8 -*-

from __future__ import unicode_literals
from django.db import models


# 用来修改admin中显示的app名称,因为admin app 名称是用 str.title()显示的,所以修改str类的title方法就可以实现.
class string_with_title(str):
    def __new__(cls, value, title):
        instance = str.__new__(cls, value)
        instance._title = title
        return instance

    def title(self):
        return self._title

    __copy__ = lambda self: self
    __deepcopy__ = lambda self, memodict: self

# Create your models here.
STATUS = {
    0: u'正常',
    1: u'草稿',
    2: u'删除',
}

# 资讯来源
NEWS = {
    0: u'oschina',
    1: u'chiphell',
    2: u'freebuf',
    3: u'cnBeta',
}


class Nav(models.Model):
    name = models.CharField(max_length=40, verbose_name=u'导航条内容')
    url = models.CharField(max_length=200, blank=True, null=True, verbose_name=u'指向地址')

    status = models.IntegerField(default=0, choices=STATUS.items(), verbose_name='状态')
    create_time = models.DateTimeField(u'创建时间', auto_now_add=True)

    class Meta:
        verbose_name_plural = verbose_name = u"导航条"
        ordering = ['-create_time']

    def __unicode__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=40, verbose_name=u'名称')
    parent = models.ForeignKey('self', default=None, blank=True, null=True, verbose_name=u'上级分类')
    rank = models.IntegerField(default=0, verbose_name=u'排序')
    status = models.IntegerField(default=0, choices=STATUS.items(), verbose_name='状态')

    create_time = models.DateTimeField(u'创建时间', auto_now_add=True)

    class Meta:
        verbose_name_plural = verbose_name = u'分类'
        ordering = ['rank', '-create_time']

    def __unicode__(self):
        if self.parent:
            return '%s-->%s' % (self.parent, self.name)
        else:
            return '%s' % (self.name)


class Author(models.Model):
    name = models.CharField(max_length=100, verbose_name=u'名称')

    def __unicode__(self):
        return self.name


class Article(models.Model):
    author = models.ForeignKey(Author, verbose_name=u'作者')
    category = models.ForeignKey(Category, verbose_name=u'分类')
    title = models.CharField(max_length=100, verbose_name=u'标题')
    en_title = models.CharField(max_length=100, verbose_name=u'英文标题')
    img = models.CharField(max_length=200, default='/static/img/article/default.jpg')
    tags = models.CharField(max_length=200, null=True, blank=True, verbose_name=u'标签', help_text=u'用逗号分隔')
    summary = models.TextField(verbose_name=u'摘要')
    content = models.TextField(verbose_name=u'正文')

    view_times = models.IntegerField(default=0)
    zan_times = models.IntegerField(default=0)

    is_top = models.BooleanField(default=False, verbose_name=u'置顶')
    rank = models.IntegerField(default=0, verbose_name=u'排序')
    status = models.IntegerField(default=0, choices=STATUS.items(), verbose_name='状态')

    pub_time = models.DateTimeField(default=False, verbose_name=u'发布时间')
    create_time = models.DateTimeField(u'创建时间', auto_now_add=True)
    update_time = models.DateTimeField(u'更新时间', auto_now=True)

    def get_tags(self):
        return self.tags.split(',')

    class Meta:
        verbose_name_plural = verbose_name = u'文章'
        ordering = ['rank', '-is_top', '-pub_time', '-create_time']

    def __unicode__(self):
        return self.title


class Column(models.Model):
    name = models.CharField(max_length=40, verbose_name=u'专栏内容')
    summary = models.TextField(verbose_name=u'专栏摘要')
    article = models.ManyToManyField(Article, verbose_name=u'文章')
    status = models.IntegerField(default=0, choices=STATUS.items(), verbose_name='状态')
    create_time = models.DateTimeField(u'创建时间', auto_now_add=True)

    class Meta:
        verbose_name_plural = verbose_name = u'专栏'
        ordering = ['-create_time']

    def __unicode__(self):
        return self.name


class Carousel(models.Model):
    title = models.CharField(max_length=100, verbose_name=u'标题')
    summary = models.TextField(blank=True, null=True, verbose_name=u'摘要')
    img = models.CharField(max_length=200, verbose_name=u'轮播图片', default='/static/img/carousel/default.jpg')
    article = models.ForeignKey(Article, verbose_name=u'文章')
    create_time = models.DateTimeField(u'创建时间', auto_now_add=True)

    class Meta:
        verbose_name_plural = verbose_name = u'轮播'
        ordering = ['-create_time']


class News(models.Model):
    title = models.CharField(max_length=100, verbose_name=u'标题')
    summary = models.TextField(verbose_name=u'摘要')
    news_from = models.IntegerField(default=0, choices=NEWS.items(), verbose_name='来源')
    url = models.CharField(max_length=200, verbose_name=u'源地址')

    create_time = models.DateTimeField(u'创建时间', auto_now_add=True)
    pub_time = models.DateTimeField(default=False, verbose_name=u'发布时间')

    class Meta:
        verbose_name_plural = verbose_name = u'资讯'
        ordering = ['-title']


class Book(models.Model):
    author = models.ForeignKey(Author, verbose_name=u'作者')
    category = models.ForeignKey(Category, verbose_name=u'分类')
    title = models.CharField(max_length=100, verbose_name=u'标题')
    en_title = models.CharField(max_length=100, verbose_name=u'英文标题')
    img = models.CharField(max_length=200, default='/static/img/article/default.jpg')
    tags = models.CharField(max_length=200, null=True, blank=True, verbose_name=u'标签', help_text=u'用逗号分隔')
    summary = models.TextField(verbose_name=u'摘要')

    view_times = models.IntegerField(default=0)
    zan_times = models.IntegerField(default=0)

    is_top = models.BooleanField(default=False, verbose_name=u'置顶')
    rank = models.IntegerField(default=0, verbose_name=u'排序')
    status = models.IntegerField(default=0, choices=STATUS.items(), verbose_name='状态')

    pub_time = models.DateTimeField(default=False, verbose_name=u'发布时间')
    create_time = models.DateTimeField(u'创建时间', auto_now_add=True)
    update_time = models.DateTimeField(u'更新时间', auto_now=True)

    def get_tags(self):
        return self.tags.split(',')

    class Meta:
        verbose_name_plural = verbose_name = u'书籍'
        ordering = ['rank', '-is_top', '-pub_time', '-create_time']

    def __unicode__(self):
        return self.title


class Chapter(models.Model):
    book = models.ForeignKey(Book, verbose_name="书名")
    title = models.CharField(max_length=100, verbose_name=u'标题')
    en_title = models.CharField(max_length=100, verbose_name=u'英文标题')
    img = models.CharField(max_length=200, default='/static/img/article/default.jpg')
    tags = models.CharField(max_length=200, null=True, blank=True, verbose_name=u'标签', help_text=u'用逗号分隔')
    summary = models.TextField(verbose_name=u'摘要')
    content = models.TextField(verbose_name=u'正文')

    view_times = models.IntegerField(default=0)
    zan_times = models.IntegerField(default=0)

    rank = models.IntegerField(default=0, verbose_name=u'排序')
    status = models.IntegerField(default=0, choices=STATUS.items(), verbose_name='状态')

    pub_time = models.DateTimeField(default=False, verbose_name=u'发布时间')
    create_time = models.DateTimeField(u'创建时间', auto_now_add=True)
    update_time = models.DateTimeField(u'更新时间', auto_now=True)

    def get_tags(self):
        return self.tags.split(',')

    class Meta:
        verbose_name_plural = verbose_name = u'章节'
        ordering = ['rank', '-pub_time', '-create_time']

    def __unicode__(self):
        return self.book.title + " : " + self.title
