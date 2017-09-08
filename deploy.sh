#! /bin/sh

echo 'Begin deploy hexo blog ...'
echo '=========================='
hexo deploy -g
echo '=========================='
echo 'Finish deploy hexo blog.'

echo ''

# push hexo
echo 'Begin push to hexo ...'
echo '=========================='
git add *
git commit -m 'update'
git pull origin hexo
git push origin hexo
echo '=========================='
echo 'Finish push to hexo.'

