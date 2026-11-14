import request from '@/utils/request'

// 查询题目列表
export function listQuestion(query) {
  return request({
    url: '/bank/question/list',
    method: 'get',
    params: query
  })
}

// 查询题目详细
export function getQuestion(questionId) {
  return request({
    url: '/bank/question/' + questionId,
    method: 'get'
  })
}

// 新增题目
export function addQuestion(data) {
  return request({
    url: '/bank/question',
    method: 'post',
    data: data
  })
}

// 修改题目
export function updateQuestion(data) {
  return request({
    url: '/bank/question',
    method: 'put',
    data: data
  })
}

// 上架/下架题目
export function changeQuestionStatus(questionId, status) {
  return request({
    url: '/bank/question/changeStatus',
    method: 'put',
    data: { questionId, status }
  })
}

// 删除题目
export function delQuestion(questionId) {
  return request({
    url: '/bank/question/' + questionId,
    method: 'delete'
  })
}
