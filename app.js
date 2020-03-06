import {
    getAuthCode,
    getUserInfo,
} from './utils/api';

let development = false; //开发环境为true,工厂环境为false,工厂环境服务器是47.103.63.213
let domain,applicationServer;
if (development===true){
    domain = "http://r1w8478651.imwork.net:9998/eapp-corp";
} else{
    domain = "https://www.ckkj.net.cn/eapp-corp";
}

App({
    userId: null,
    externalParams:null,
    _companyName: "重庆长凯科技有限责任公司",
    domain:domain,
    async getUserId() {
        if (this.userId) { 
            return this.userId;
        }

        const authCode = await getAuthCode('auth_base'); //静默授权
        const { userId } = await getUserInfo(authCode);
        this.userId = userId;
        return userId;
    },
    onLaunch(options) {
        // 第一次打开
        // options.query == {number:1}

        if (options.query) {
            const params = options.query.params;
            this.externalParams = JSON.parse(params);
            console.log("a:"+JSON.stringify(this.externalParams))

        }
        console.info('App onLaunch');
    },
    onShow(options) {
        // 从后台被 scheme 重新打开
        // options.query == {number:1}
        if (options.query) {
            const params = options.query.params;
            this.externalParams = JSON.parse(params);
            console.log("ab:"+JSON.stringify(this.externalParams))

        }
    },
});
