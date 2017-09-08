#! /bin/sh

echo '=========================='
echo 'Begin deploy hexo blog ...'
hexo deploy -g
echo 'Finish deploy hexo blog.'
echo '=========================='

echo ''

# push hexo
echo '=========================='
echo 'Begin push to hexo ...'
git add *
git commit -m 'update'
git pull origin hexo
git push origin hexo
echo 'Finish push to hexo.'
echo '=========================='

