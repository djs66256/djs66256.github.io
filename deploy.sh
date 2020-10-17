#! /bin/sh

if ![-d ".deploy_git"]
then
  git clone git@github.com:djs66256/djs66256.github.io.git .deploy_git
fi

echo 'Use node v13'
nvm use 13

echo 'Begin deploy hexo blog ...'
echo '=========================='
./node_modules/.bin/hexo generate
./node_modules/.bin/hexo deploy
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

