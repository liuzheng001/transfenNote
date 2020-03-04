import {getCustomList,verificationPass} from "../../utils/api";

Page({
    data: {
        invoiceObj: null,
        //测试
        // invoiceObj: {invoiceCode:'123',invoiceNumber:'12345',userInfo:{userId:'2088502816319212'}},
        customList:[],


        isCreateFlow:false,//显示流转信息

        customName: '', //购买方customName
        newInvoice:false,//true代表处于新开票阶段,确认客户等信息,而且不展示二维码
        invoiceFlowId:null,
        ourCompany:getApp()._companyName,//默认开票公司
        acceptCompany:null,//接受人公司

        jobList: ['财务', '销售', '采购', '库管', '其它'],
        jobIndex:0,

        qrCode: '',
        modalOpened:false,
        countTime:null,//倒计时

    },
    customId: null,  //选择的customId
async  onLoad(query) {
        console.log(this.customId)
        my.showLoading();
        try{
            const result = await this.isExistInvoice(JSON.parse(query.invoiceObj))
            if (result.Code == 0) { //无发票记录
                //后台得到客户列表
                const customList = await getCustomList();
                this.setData({
                // customName:result.data.customName,
                    customList:customList,
                    invoiceObj: JSON.parse(query.invoiceObj),
                    newInvoice:true,
                })
             
            }else{
                this.setData({
                    newInvoice:false,
                    customName:result.data.customName,                    
                    invoiceObj: JSON.parse(query.invoiceObj),
                })
            }
            my.hideLoading();
        }catch (e) {
            this.toast(e.Message || '扫描失败');
            my.hideLoading();

            //返回index页面
        }

    },

    //得到serachList搜索框的值
onCustomListIndex(customId,customName){
        /*my.alert({
            content:customId
        });*/
        this.customId = customId;
        // this.customName = customName;
        this.setData({
            customName,
        })
    },
async formSubmit(event) {
    //校验
    const form = event.detail.value;
    if ( !checkform(form,this.customId)) return;
    my.confirm({
        itle: '提示',
        content: '向手机发送确认信息',
        confirmButtonText: '发送',
        success: async (result) => {
            if (result.confirm == true) {
                //若上一个流转确认为1,则建立新发票流转记录
                try {
                    my.showLoading();

                    let userInfo = this.data.invoiceObj.userInfo;
                    userInfo.nickName = form.nickName;
                    userInfo.userId = getApp().userId;
                    let updateParams = {
                        phoneNumber: form.phoneNumber,
                        acceptCompany:form.acceptCompany,
                        job: form.job,
                        userInfo: userInfo,
                    };

                    const invoiceParams = {...this.data.invoiceObj, ...updateParams};
                    const res = await this.createInvoiceFlow(invoiceParams);
                    console.log(JSON.stringify(res));
                    if (res.Code == 1) {     //代表有一个流转,发放人未确认,可以在这里扩展是否再发短信或二维码
                        this.toast(res.Message);
                        my.reLaunch({
                            url:`/pages/index/index?invoiceCode=${this.data.invoiceObj.invoiceCode}&invoiceNumber=${this.data.invoiceObj.invoiceNumber}`
                        })
                    }
                    //发送二维码交接
                    if (res.Code == 0) {  //需要发放人确认
                        const invoiceParams =  res.data;
                        if (invoiceParams.flowConfirm == 0) {
                            const qrCode = await this.getQRCode(invoiceParams);
                            this.setData({
                                //    customName,
                                qrCode,
                                modalOpened: true
                            })
                        }
                        /*else {  //1代表是开票人建立开票记录并建立第一个流转记录
                            const {invoiceFlowId} = res.data;
                            this.setData({
                                newInvoice:true,
                                invoiceFlowId
                            })
                        }*/
                    }


                    /* //发送短信
                     if (res.Code == 0) {  //需要发放人确认
                         const {invoiceFlowId, confirmPhoneNumber, flowConfirm} = res.data;
                         if (flowConfirm == 0){
                             await this.sendSMSLink(invoiceFlowId, confirmPhoneNumber);
                             this.toast('已发送链接短信,等待确认.');
                         } else {  //1代表是开票人建立开票记录并建立第一个流转记录
                             my.alert({content: '该发票已进入系统.'});
                         }
                     }*/
                } catch (e) {
                this.toast(e.code||"失败");
                } finally {
                    my.hideLoading();
                }
            }
        },
        fail: () => {
        }
    });



},

    /***
     * 向后台提交开票确认,建立第一个流程
     * @returns {Promise<void>}
     */
    async confirmInvoice(event){
        const form = event.detail.value;
        if ( !checkform(form,this.customId)) return;
        my.confirm({
            itle: '提示',
            content: '确认开票信息正确?',
            confirmButtonText: '确认',
            success: async (result) => {
                if (result.confirm == true) {
                    try {
                        const form = event.detail.value;
                        let userInfo = this.data.invoiceObj.userInfo;
                        userInfo.nickName = form.nickName;
                        userInfo.userId = getApp().userId;
                        let updateParams = {
                            phoneNumber: form.phoneNumber,
                            customId: this.customId,
                            job: form.job,
                            userInfo: userInfo,
                            acceptCompany:form.acceptCompany,

                        };
                        const invoiceParams = {...this.data.invoiceObj, ...updateParams};
                        console.log(JSON.stringify(invoiceParams))
                        const result = await createInvoice(JSON.stringify(invoiceParams))
                        if (result === true) {
                            this.toast("记票成功");
                        }
                    }catch (e) {
                        this.toast(e.code||"失败");
                    }finally {
                        my.hideLoading();
                    }

                    my.reLaunch({
                        url:`/pages/index/index?invoiceCode=${this.data.invoiceObj.invoiceCode}&invoiceNumber=${this.data.invoiceObj.invoiceNumber}`
                    })
                }
            },
            fail: () => {
            }
        });

    },
    async showFlowContent() {//显示新建流转

        //查看当前发票能否建立流转
        try {
            const invoiceParams = {invoiceCode:this.data.invoiceObj.invoiceCode, invoiceNumber:this.data.invoiceObj.invoiceNumber};
            await isCreateFlow(invoiceParams)
            this.setData({
                isCreateFlow:true
            })
        }catch (e) {
            this.toast(e.message||"建立流转失败")
}


    },
    cancelAndBack(){
        my.reLaunch({
            url:`/pages/index/index?invoiceCode=${this.data.invoiceObj.invoiceCode}&invoiceNumber=${this.data.invoiceObj.invoiceNumber}`
        })
    },
    /**
     * 调用服务端接口推送模版消息
     * 接口参数和服务端约定
     * @param {any} options
     * 模板推送只能发给订单创建者和form使用者,不能满足场景,先使用短信发送链接方式,提醒上人次(发放人)确认
     */
    /*async sendTemplateMessage(options) {
        const TEMPLATE_ID = 'YjYwOWEzNzEwZDY5MTVmNGQ2ZjhlMWRjZjczZmVkNDM='; //好像无效

        const defaults = {
            user_template_id: TEMPLATE_ID,
            page: 'pages/index/index',
            data: JSON.stringify({
                keyword1: { value: '测试模版消息推送完成' },
                // keyword2: { value: formatDateTime() }
            }),
        };
        const res = await my.request({
            url: `http://r1w8478651.imwork.net:9998/shoppay-php/aop/controller/TemplatemessageSendForInvoiceTransferController.php`,
            data: {
                ...defaults,
                ...options,
            }
        });
        const { data } = res;
        if (!data.success) {
            throw new Error(data.subMsg || '消息推送失败');
        }
        return data;
    },*/
    toast(message) {
        my.showToast({
            content: message,
            duration: 3000
        });
    },
    /***
     * 短信方式让发放人确认接受链接,使用阿里短信服务,按次计算,约4分每条
     * @param options
     * @returns {Promise<void>}
     */
    sendSMSLink(invoiceFlowId,confirmPhoneNumber) {
        return new Promise((resolve, reject)=>{
              const url = `http://r1w8478651.imwork.net:9998/ailishortmessage-php/smssend.php`
              my.request({
                url: url,
                data: {
                    invoiceFlowId: invoiceFlowId,//数据库中的发票Id,小程序corpId不暴露,后台直接获取
                    confirmPhoneNumber: confirmPhoneNumber //发放人的手机
                },
                success: (res) => {
                    if (res.data.success) {
                        resolve();
                    } else {
                        reject(res.data);
                    }
                },
                fail: (res) => {
                    reject(res.data);
                },
            });
        })
    },
    /***
     * 向后台查询票据,不存在则建立新的开票和流转记录
     * @param invoice对象,向后台传递
     * @returns {Promise<void>},resolve返回invoiceFlowId,发票流转Id
     */
    isExistInvoice(invoiceParams) {
        return new Promise((resolve, reject)=>{
            const url = `http://r1w8478651.imwork.net:9998/eapp-corp/fmSailsStatistics.php`;
            my.request({
                url: url,
                data: {
                    action:'isExistInvoice',
                    invoiceParams:JSON.stringify(invoiceParams) ,//数据库中的发票Id,小程序corpId不暴露,后台直接获取
                },
                success: (res) => {
                    if (res.data.Code == 0 || res.data.Code == 1) {
                        resolve(res.data);
                    }  else {
                        reject(res.data);
                    }
                },
                fail: (res) => {
                    reject(res.data);
                },
            });
        })
    },
    /***
     * 向后台提交票据流转记录,由后台判断是否建立新的流转记录.若流转记录不存在,fm建立一个发票记录,为以后挂账作准备
     * @param invoice对象,向后台传递
     * @returns {Promise<void>},resolve返回invoiceFlowId,发票流转Id
     */
    createInvoiceFlow(invoiceParams) {
        return new Promise((resolve, reject)=>{
            const url = `http://r1w8478651.imwork.net:9998/eapp-corp/fmSailsStatistics.php`;
            my.request({
                url: url,
                data: {
                    action:'invoiceFlow',
                    invoiceParams:JSON.stringify(invoiceParams) ,//数据库中的发票Id,小程序corpId不暴露,后台直接获取
                },
                success: (res) => {
                    if (res.data.Code == 0 || res.data.Code ==1  ) {
                        resolve(res.data);
                    }  else {
                        reject(res.data);
                    }
                },
                fail: (res) => {
                    reject(res.data);
                },
            });
        })
    },
    /***
     * 适合面对面
     * 由接收人发起接收,生成二维码,向发放人展示,
     * @param invoice对象,向后台传递
     * @returns {Promise<void>},resolve返回invoiceFlowId,发票流转Id
     */
    getQRCode(invoiceParams) {
        // const invoiceParams = {invoiceCode:this.data.invoiceObj.invoiceCode,invoiceNumber:this.data.invoiceObj.invoiceNumber};
        return new Promise((resolve, reject)=>{
            my.request({
                url: `http://r1w8478651.imwork.net:9998/shoppay-php/aop/controller/alipayOpenAppQrcodeCreate.php`,
                data: {
                    url_param: "pages/verification/verification",//小程序页面
                    query_param: `{\\\"invoiceFlowId\\\":\\\"${invoiceParams.invoiceFlowId}\\\",\\\"issueUserId\\\":\\\"${invoiceParams.issueUserId}\\\"}` ,
                    describe: "小程序验证"
                },
                success: async (res) => {
                    if (!res.data.success) {
                        reject({
                            code: res.data.code,
                        });
                    }
                   const qrCodeUrl= res.data.qrCodeUrl
                    invoiceParams.qrCodeUrl = qrCodeUrl;
                    //将二维码写入后台
                    const rec = await updateQrcode(invoiceParams);
                    if(rec.Code == 0) {
                        resolve(res.data.qrCodeUrl);
                    }
                },
                fail: (error) => {
                    reject({
                        message: '二维码生成异常',
                        error
                    });
                }
            });
        });
    },

    //modal关闭,将qrCode存入,便于再次调用
    onModalClick(){
        my.confirm({
            itle: '提示',
            content: '确认关闭?',
            confirmButtonText: '确认',
            success: async (result) => {
                if (result.confirm == true) {
                    my.reLaunch({
                        url:`/pages/index/index?invoiceCode=${this.data.invoiceObj.invoiceCode}&invoiceNumber=${this.data.invoiceObj.invoiceNumber}`
                    })
                    this.setData({
                        modalOpened:false,
                    })

                }
            },
            fail: () => {
            }
        });


    },
    //选择职务
    jobSelect(e) {
        this.setData({
            jobIndex: e.detail.value,
        })
    },
    //接受人公司选择
    radioChange(e) {
        console.log('你选择的框架是：', e.detail.value);
        if (e.detail.value == "ourCompany") {
            this.setData({
                acceptCompany: getApp()._companyName,
            })
        }else{
            this.setData({
                acceptCompany:"",
            })
        }
    },

});

function getCountDown(that,time){ //一分钟倒计时
    if(time <= 0){
        return ;
    }else{
        time--;
        that.setData({
            countTime:time
        })
    }
    setTimeout(function (){getCountDown(that,time)}, 1000);
}

function checkform(form,customName) {
    let str = /^1\d{10}$/
    if (!str.test(form.phoneNumber)) {
        my.showToast({
            content: '手机号不正确',
        })
        return false
    }
    if (form.alipayId == "" || form.job== "" || customName == "" ||form.nickName== "" || form.acceptCompany=="") {
        my.showToast({
            content: '有必填信息,没有完成,请检查.',
        })
        return false
    }
    return true

}

/***
 * 向后台查询发票流转过程
 * params: invoiceCode,invoiceNumber指定发票唯一,userId指定有无查看权限,也可不限制
 * @returns {Promise 返回 发票流转的步骤信息
     */
function updateQrcode(invoiceParams) {
    return new Promise((resolve, reject)=>{
        my.request({
            url: `http://r1w8478651.imwork.net:9998/eapp-corp/fmSailsStatistics.php`,
            data: {
                action: "updateQrcode",
                invoiceParams:JSON.stringify(invoiceParams),
            },
            success: (res) => {
                if (res.data.success) {
                    resolve(res.data);
                }else{
                    reject({message:res.data.Message})
                }
            },
            fail: (error) => {
                reject({
                    message: '查询发票流转列表失败'+JSON.stringify(error)
                });
            }
        });
    });
}

/***
 * 建立发票记录和第一个流转记录
 * params:
 * @returns {Promise 返回 发票流转的步骤信息
     */
function createInvoice(invoiceParams) {
    return new Promise((resolve, reject)=>{
        my.request({
            url: `http://r1w8478651.imwork.net:9998/eapp-corp/fmSailsStatistics.php`,
            data: {
                action: "createInvoice",
                invoiceParams:JSON.stringify(invoiceParams),
            },
            success: (res) => {
                if (res.data.success) {
                    resolve(res.data);
                }else{
                    reject({message:res.data.Message})
                }
            },
            fail: (error) => {
                reject({
                    message: '查询发票流转列表失败'+JSON.stringify(error)
                });
            }
        });
    });
}
/***
 *判断有无建立新流转权限
 * params:
 * @returns {Promise 返回 发票流转的步骤信息
     */
function isCreateFlow(invoiceParams) {
    return new Promise((resolve, reject)=>{
        my.request({
            url: `http://r1w8478651.imwork.net:9998/eapp-corp/fmSailsStatistics.php`,
            data: {
                action: "isCreateFlow",
                invoiceParams:JSON.stringify(invoiceParams),
            },
            success: (res) => {
                if (res.data.success) {
                    resolve(res.data);
                }else{
                    reject({message:res.data.Message})
                }
            },
            fail: (error) => {
                reject({
                    message: '查询新建流转权限失败'+JSON.stringify(error)
                });
            }
        });
    });
}

