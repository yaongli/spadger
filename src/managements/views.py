from __future__ import unicode_literals
from django.shortcuts import render
from django.views.generic import View,TemplateView,ListView,DetailView
from django.shortcuts import get_object_or_404, redirect, get_list_or_404
from django.contrib import messages
from braces.views import LoginRequiredMixin
from profiles.models import Profile
from django.conf import settings
from django.contrib.auth import get_user_model

PAGE_NUM = 10

class UserList(LoginRequiredMixin, ListView):
    template_name = "managements/user_list.html"
    context_object_name = 'user_list'
    paginate_by = PAGE_NUM
    http_method_names = ['get']

    def get_queryset(self):
        UserModel = get_user_model()
        user_list = UserModel.objects.order_by("-date_joined")
        return user_list
