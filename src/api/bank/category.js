import request from '@/utils/request'

// 查询分类列表（平铺，前端 handleTree 组树）
export function listCategory(query) {
  return request({
    url: '/bank/category/list',
    method: 'get',
    params: query
  })
}

// 查询分类下拉树
export function categoryTreeSelect(query) {
  return request({
    url: '/bank/category/treeselect',
    method: 'get',
    params: query
  })
}

// 查询分类详细
export function getCategory(categoryId) {
  return request({
    url: '/bank/category/' + categoryId,
    method: 'get'
  })
}

// 新增分类
export function addCategory(data) {
  return request({
    url: '/bank/category',
    method: 'post',
    data: data
  })
}

// 修改分类
export function updateCategory(data) {
  return request({
    url: '/bank/category',
    method: 'put',
    data: data
  })
}

// 删除分类（有子分类或分类下有题目时后端会拒绝）
export function delCategory(categoryId) {
  return request({
    url: '/bank/category/' + categoryId,
    method: 'delete'
  })
}
