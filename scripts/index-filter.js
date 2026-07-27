'use strict';

var pagination = require('hexo-pagination');

/**
 * 为过滤后的文章数组创建兼容的 mock 对象，
 * 支持 hexo-pagination 的 .length / .slice(start, end) 和
 * 主题模板中 page.posts.sort('date', -1).toArray() 链式调用
 */
function mockQuery(data) {
  return {
    data: data,
    length: data.length,
    sort: function(field, order) {
      if (!order) order = 1;
      var sorted = data.slice();
      if (field === 'date') {
        sorted.sort(function(a, b) {
          return order * (a.date.valueOf() - b.date.valueOf());
        });
      }
      return mockQuery(sorted);
    },
    toArray: function() {
      return data.slice();
    },
    slice: function(start, end) {
      return mockQuery(data.slice(start, end));
    },
    limit: function(n) {
      return mockQuery(data.slice(0, n));
    }
  };
}

hexo.extend.generator.register('index', function(locals) {
  var config = this.config;

  // 获取排序后的原始文章数据
  var allData = locals.posts.sort(config.index_generator.order_by).toArray();

  // 过滤掉所有 category 为 wwdc2025 的文章
  var filtered = allData.filter(function(post) {
    var cats = post.categories;
    if (!cats || !cats.length) return true;
    for (var i = 0; i < cats.length; i++) {
      if (cats.data[i].name === 'wwdc2025') return false;
    }
    return true;
  });

  // sticky 排序
  filtered.sort(function(a, b) {
    return (b.sticky || 0) - (a.sticky || 0);
  });

  var posts = mockQuery(filtered);

  var paginationDir = config.pagination_dir || 'page';
  var path = config.index_generator.path || '';

  return pagination(path, posts, {
    perPage: config.index_generator.per_page,
    layout: ['index', 'archive'],
    format: paginationDir + '/%d/',
    data: {
      __index: true
    }
  });
});
