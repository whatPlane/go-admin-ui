import request from '@/utils/request'

// 查询EasyPlayer列表
export function listEasyPlayer(query) {
    return request({
        url: '/api/v1/easy-players',
        method: 'get',
        params: query
    })
}

// 查询EasyPlayer详细
export function getEasyPlayer (playerId) {
    return request({
        url: '/api/v1/easy-players/' + playerId,
        method: 'get'
    })
}


// 新增EasyPlayer
export function addEasyPlayer(data) {
    return request({
        url: '/api/v1/easy-players',
        method: 'post',
        data: data
    })
}

// 修改EasyPlayer
export function updateEasyPlayer(data) {
    return request({
        url: '/api/v1/easy-players/'+data.playerId,
        method: 'put',
        data: data
    })
}

// 删除EasyPlayer
export function delEasyPlayer(data) {
    return request({
        url: '/api/v1/easy-players',
        method: 'delete',
        data: data
    })
}

