运行任务

[利用 Celery 构建 Web 服务的后台任务调度模块](http://www.ibm.com/developerworks/cn/opensource/os-cn-celery-web-service/index.html)

在任务队列系统中，一般有任务生产者、任务处理中间方以及任务消费者三方。其中任务生产者负责生产任务，比如“将新鲜事推送至用户 A 的所有好友”这一任务的发起方就可以称作任务生产者。任务处理中间方负责接收任务生产者的任务处理请求，对任务进行调度，最后将任务分发给任务消费者来进行处理。任务消费者就是执行任务的一方，它负责接收任务处理中间方发来的任务处理请求，完成这些任务，并且返回任务处理的结果。在生产方、消费者和任务处理中间方之间一般使用消息传递的方式来进行通信。

三个终端：

1. 启动redis server
2. 启动任务执行者，在src目录下

`celery -A picha worker -l info`

3. 启动任务scheduler，在src目录下

`celery -A picha beat -l info`











