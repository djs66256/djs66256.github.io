#! /bin/sh

echo 'Begin deploy hexo blog ...'
hexo deploy -g
echo 'Finish deploy hexo blog.'

# push hexo
echo 'Begin push to hexo ...'
git add *
git commit -m 'update'
git pull origin hexo
git push origin hexo
echo 'Finish push to hexo.'

