// 接口函数

const axios = require('axios')
const util = require('./index.js')

const regExp = util.regExp;
const json2url = util.json2url;

/**
 * @TODO 音乐 axios实例
 */
let musicInterface = axios.create({
    baseURL: 'https://c.y.qq.com',
    timeout: 2 * 1000
})
/**
 * @TODO 福利 axios实例
 */
let welfareInterface = axios.create({
    baseURL: 'http://gank.io',
    timeout: 2 * 1000
})


// apiUrl 实际代理地址 
const apiUrl = {
    searchUrl: '/soso/fcgi-bin/client_search_cp',
    albumimgUrl: 'http://imgcache.qq.com/music/photo/album_300/',
    tokenUrl: '/base/fcgi-bin/fcg_music_express_mobile3.fcg',
    lyricUrl: '/lyric/fcgi-bin/fcg_query_lyric_new.fcg',
    top100Url: '/v8/fcg-bin/fcg_v8_toplist_cp.fcg?g_tk=5381&uin=0&format=json&inCharset=utf-8&outCharset=utf-8¬ice=0&platform=h5&needNewCode=1&tpl=3&page=detail&type=top&topid=27&_=1519963122923',
    welfareUrl: '/api/data/福利/',
};

// 获取音乐列表
function getMusicList(params: any) {
    return new Promise((resolve, reject) => {
        musicInterface({
            method: 'get',
            url: apiUrl.searchUrl,
            params: params
        }).then((res: { data: { match: (arg0: any) => string[]; song: { curnum: any; curpage: any; list: any; }; }; }) => {
            res = JSON.parse(res.data.match(regExp.jsonpRegExp)[0]);
            class paramC {
                curnum:number = res.data.song.curnum
                curpage:number = res.data.song.curpage
                list:any[] = []
            }
            let params = new paramC();
            for (let item of res.data.song.list) {
                params.list.push({
                    songname: item.songname,
                    singer: item.singer[0],
                    albumname: item.albumname,
                    songmid: item.songmid,
                    albumimg: apiUrl.albumimgUrl + (item.albumid % 100) + '/300_albumpic_' + item.albumid + '_0.jpg'
                })
            }
            resolve(params);
        }, (err: any) => {
            reject(err);
        })
    })
}

/**
    * @TODO: 获取token 拼接播放地址
    * @param: format 'json205361747',
    * @param: platform 'yqq',
    * @param: cid '205361747',
    * @param: guid //126548448 5043253136
    * @param: songmid 歌曲songmid，需要在搜索歌曲后获取
    * @param: filename 文件名
    */
function getMusicToken(params: { guid: string; songmid: string; }, lyricData?: any) {
    let params_data = {
        format: 'json205361747',
        platform: 'yqq',
        cid: '205361747',
        guid: params.guid, //126548448 5043253136
        songmid: params.songmid,
        filename: 'C400' + params.songmid + '.m4a',
        aggr: 1,
        flag_qc: 0,
        cr: 0
    }
    return new Promise((resolve, reject) => {
        musicInterface({
            method: 'get',
            url: apiUrl.tokenUrl,
            params: params_data
        }).then((res: any) => {
            let musicUrl = "http://ws.stream.qqmusic.qq.com/" + res.data.data.items[0].filename + "?fromtag=0&guid=" + params.guid + '&vkey=' + res.data.data.items[0].vkey
            
            let lyric = (lyricData && lyricData.code == '0') ? lyricData.lyric : '无';
            resolve({
                vkey: res.data.data.items[0].vkey,
                musicUrl: musicUrl,
                lyric: lyric
            });
        }, (err: any) => {
            reject(err);
        })
    })
}

/**
	* @TODO: 获取top100
    */
function getMusicTop() {
    return new Promise((resolve, reject) => {
        musicInterface({
            method: 'get',
            url: apiUrl.top100Url
        }).then((res: { data: any; code: any; date: any; total_song_num: any; topinfo: any; songlist: any; }) => {
            res = res.data;
          
            class paramC {
                code:string = res.code
                date:string = res.date
                curnum:number = res.total_song_num
                curpage:number = 1
                list: any[] = []
                topinfo: any = res.topinfo
            }

            let params = new paramC();

            for (let item of res.songlist) {
                params.list.push({
                    cur_count: item.cur_count,
                    songname: item.data.songname,
                    singer: item.data.singer[0],
                    albumname: item.data.albumname,
                    songmid: item.data.songmid,
                    albumimg: apiUrl.albumimgUrl + item.data.albumid % 100 + '/300_albumpic_' + item.data.albumid + '_0.jpg'
                })
            }
            resolve(params);
        }, (err: any) => {
            reject(err);
        })
    })
}

/**
	* @TODO: 获取歌词
	* @param: songmid 歌曲songmid，需要在搜索歌曲后获取
	* @param: format 格式，建议加上format=json
	* @param: nobase64 默认0, 必须填1格式化返回数据
    */
function getLyric(params: { format: string; nobase64: number; }) {
    params.format = 'json';
    params.nobase64 = 1;
    return new Promise((resolve, reject) => {
        musicInterface({
            method: 'get',
            headers: {
                'Referer': 'https://y.qq.com/portal/player.html'
            },
            url: apiUrl.lyricUrl,
            params: params
        }).then((res: { data: unknown; }) => {
            resolve(res.data);
        }, (err: any) => {
            reject(err);
        })
    })
}

// async 
/**
 * 
 * @TODO 后续更改async用法方式。
 */
// 搜索列表
async function asyncGetMusicList(params: any) {
    return await getMusicList(params);
}
// 歌曲地址
async function asyncGetMusicToken(params: any) {
    if (params.lyric == '1') {
        var lyricData = await getLyric(params);
        return await getMusicToken(params, lyricData);
    } else {
        return await getMusicToken(params);
    }
}
// top100
async function asyncGetMusicTop() {
    return await getMusicTop();
}
// 歌词
async function asyncGetLyric(params: any) {
    return await getLyric(params);
}

// 获取福利图片列表
function getWelfareList(params: { per_page: string; page: string; }) {
    return new Promise((resolve, reject) => {
        welfareInterface({
            method: 'get',
            url: encodeURI(apiUrl.welfareUrl + params.per_page + '/' + params.page),
        }).then((res: { data: unknown; }) => {
            resolve(res.data);
        }, (err: any) => {
            reject(err);
        })
    })
}

async function asyncGetWelfareList(params: any) {
    return await getWelfareList(params);
}

export default {
    getMusicList: getMusicList,
    asyncGetMusicList: asyncGetMusicList,
    getMusicToken: getMusicToken,
    asyncGetMusicToken: asyncGetMusicToken,
    getMusicTop: getMusicTop,
    asyncGetMusicTop: asyncGetMusicTop,
    getLyric: getLyric,
    asyncGetLyric: asyncGetLyric,
    getWelfareList: getWelfareList,
    asyncGetWelfareList: asyncGetWelfareList,

}