Welcome to spadger!
==============================



## MySQL

首先，允许mysql提供远程访问

```
# Instead of skip-networking the default is now to listen only on
# localhost which is more compatible and is not less secure.
bind-address            = 0.0.0.0 #127.0.0.1
```
重启mysql `service mysql restart`，然后创建数据库和用户

```
$ mysql -u root -p
mysql>  create database spadger;
mysql>  CREATE USER 'spadger'@'%' IDENTIFIED BY 'spadger2016';
mysql>  GRANT ALL PRIVILEGES ON spadger.* TO 'spadger'@'%';
mysql>  FLUSH PRIVILEGES;
```

安装MySQL-python

```
apt-get install python-dev libmysqlclient-dev
pip install MySQL-python
```


在`local.env`文件配置数据库连接

```
DATABASE_URL=mysql://spadger:spadger2016@45.32.248.185:3306/spadger
```

