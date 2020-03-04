import {
    getAuthCode,
    getUserInfo,
} from './utils/api';

App({
    userId: null,
    externalParams:null,
    _companyName: "重庆长凯科技有限责任公司",
    async getUserId() {
        if (this.userId) { 
            return this.userId;
        }

        const authCode = await getAuthCode('auth_user');
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
