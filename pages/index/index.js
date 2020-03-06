import {verificationPass} from "../../utils/api";

Page({
  data: {
        userInfo:null,
      invoiceCode:null,
      invoiceNumber:null,
      invoiceAmount:null,

      acceptUserId:null,$issueUserId:null,
      invoiceFlowId:null,//流转表中最后一个记录的id
      //验证二维码模态框
      qrCode:null,
      modalOpened:false,
    //步骤条元素
      items: [
          /*{
          title: '步骤1',
          description: '这是步骤1的描述文档，文字足够多的时候会换行，设置了成功的icon',
          activeIcon: 'https://i.alipayobjects.com/common/favicon/favicon.ico',
          size: 20,}*/
      ],
      activeIndex: null,//步骤条激活号
      failIndex: null,//失败的序号
      size: 0,

  },
    currentStatus:null,//当前steps的状态,后台的确认流转为0,或者1
  async onLoad(query) {
      //向后台查询当前发票流转信息
      // const invcoieParams= JSON.parse(query.invoiceParams);
      //如果获取用户信息已授权,可以直接读取

    try{
        my.getSetting({
            success: (res) => {
              let userInfo;
              if (res.authSetting.userInfo === true) {
                  my.getOpenUserInfo({
                      fail: (res) => {
                        console.log(JSON.stringify(res))
                      },
                      success: (res) => {
                          userInfo = JSON.parse(res.response).response // 以下方的报文格式解析两层 response
                          /*this.setData({
                              userInfo : userInfo
                          });*/
                          my.setOptionMenu({
                              icon: userInfo.avatar,
                          });
                      }
                  });
              }
          },
          fail:(res)=>{
              my.alert(JSON.stringify(res));
          }
      })
    }catch(e){
          my.alert({content:'首页载入失败.'})
      }
    try{
          const {invoiceCode,invoiceNumber} = query
          if (invoiceCode && invoiceNumber) {
              const result = await queryInvoiceFlowList(invoiceCode,invoiceNumber);
              // const result = await queryInvoiceFlowList();
              const count = result.data.items.length;
              this.currentStatus =result.data.currentStatus

              this.setData({
                  items:result.data.items,
                  activeIndex:count,
                  invoiceCode,
                  invoiceNumber,
                  invoiceAmount:result.data.invoiceAmount,
                  acceptUserId:result.data.acceptUserId,
                  issueUserId:result.data.issueUserId,
                  qrCode:result.data.qrCode,
                  invoiceFlowId:result.data.invoiceFlowId
              })
          }
      }catch (e) {
          my.showToast({
              content: JSON.stringify(e)||"初始化错误",
              duration: 3000
        })
    }
},
  async onShow(query){
  },

  async onGetAuthorize(res) {
        let userInfo;
        try {
        await   my.getOpenUserInfo({
              fail: (res) => {
              },
              success: (res) => {
                  userInfo = JSON.parse(res.response).response // 以下方的报文格式解析两层 response
                  /* my.alert({
                       content:JSON.stringify(userInfo)
                   });*/
                  // my.alert({content : userInfo})
              }
          });
          const app = getApp();
          const userId = await app.getUserId();
          userInfo.userId = userId;

        }catch (e) {
          // my.alert({content:'获取发票信息失败.'})
      }
        this.setData({
            userInfo : userInfo
        });

        my.scan({
            type: 'qr',
            success: (res) => {
                // my.alert({ title: res.code });
                let invoiceObj = getInvoiceMessage(res.code);
                invoiceObj.userInfo = userInfo;
                if (invoiceObj === null) {
                    my.alert({content: "这不是发票二维码"})
                }else{
                    // my.alert({content: JSON.stringify(invoiceObj)})
                    my.navigateTo({
                        url:`/pages/invoiceDetail/invoiceDetail?invoiceObj=${JSON.stringify(invoiceObj)}`
                    });
                }
            },

        });
    },
    //通过steps view进入invoiceFlow
   async enterInvoiceFlowDetail(){
      console.log("current:"+this.currentStatus+this.data.invoiceFlowId);
        //查询当前发票的流转记录后台状态,确认流转为1,代表已通过,0代表待验证
       if (this.currentStatus == false )  { //有待验证的项目
           const app =getApp();
           if (this.data.acceptUserId == app.userId) { //当前userid是接受人,再次展示二维码
               /*my.navigateTo({
                   url:`/pages/invoiceDetail/invoiceDetail`
               });*/
               this.setData({
                    modalOpened:true
               })

           }else if(this.data.issueUserId ==  app.userId){ //当前userid是验证人,则进入验证页
               my.navigateTo({
                   url:`/pages/verification/verification?invoiceFlowId=${this.data.invoiceFlowId}`
               });
           }else{
               my.alert({
                   content:"您没有权限进入下一步操作"
               })
           }
       }else{ //进入验证页,但没有验证按键

           my.navigateTo({
               url:`/pages/verification/verification?mode=check&invoiceFlowId=${this.data.invoiceFlowId}`
           });
       }
    },
   async refreshList(){//刷新列表
        try{
            const {invoiceCode,invoiceNumber} = this.data
            if (invoiceCode && invoiceNumber) {
                const result = await queryInvoiceFlowList(invoiceCode,invoiceNumber);
                // const result = await queryInvoiceFlowList();
                const count = result.data.items.length;
                this.currentStatus =result.data.currentStatus
                this.setData({
                    items:result.data.items,
                    activeIndex:count,
                    invoiceCode,
                    invoiceNumber,
                    invoiceAmount:result.data.invoiceAmount,
                    //列表中最后一个正常记录的相关值
                    acceptUserId:result.data.acceptUserId,
                    issueUserId:result.data.issueUserId,
                    qrCode:result.data.qrCode,
                    invoiceFlowId:result.data.invoiceFlowId
                })
            }
        }catch (e) {
            my.showToast({
                content: JSON.stringify(e),
                duration: 3000
            })
        }
    },

    //modal关闭
    onModalClick() {
        this.setData({
            modalOpened: false,
        })
    },

});

/**
 *
 * @param code
 * @returns {null 不是发票二维码, invoiceObj结果对象}
 */

function getInvoiceMessage(code) {
    /*01,10,044001500111,81966722,173.79,20170524,17884534745749991611,BE2D

    第一项
    第二项：发票种类代码，10-增值税电子普通发票；04-增值税普通发票；01-增值税专用发票
    第三项：发票代码
    第四项：发票号码
    第五项：开票金额
    第六项：代表开票日期
    第七项：发票校验码，增值税专用发票是没有校验码的，没有则为空字符串
    第八项：随机产生的机密信息*/

  const invoice = code.split(',')
    let invoiceObj = {};
    /*if (!invoice.isArray) {
        return null;
    }*/
    if(invoice[1] === '10'){
        invoiceObj.type = '增值税电子普通发票';
    }else if (invoice[1] === '01') {
        invoiceObj.type = '增值税专用发票';
    }else if (invoice[1] === '04') {
        invoiceObj.type = '增值税普通发票';
    }
    invoiceObj.invoiceCode = invoice[2];
    invoiceObj.invoiceNumber = invoice[3];
    invoiceObj.invoiceAmount = invoice[4];
     if(invoice[5] && invoice[5].length === 8) {
         invoiceObj.date = invoice[5].substr(0, 4) + "/" + invoice[5].substr(4, 2) + "/" + invoice[5].substr(6, 2);
     }

    invoiceObj.checkCode = invoice[6];
    if (invoiceObj.type && invoiceObj.date) {  //检验不通过,则不是发票二维码      \
      return invoiceObj;

    }else{
      return null;
    }
}
/***
 * 向后台查询发票流转过程
 * params: invoiceCode,invoiceNumber指定发票唯一,userId指定有无查看权限,也可不限制
 * @returns {Promise 返回 发票流转的步骤信息
     */
function queryInvoiceFlowList(invoiceCode,invoiceNumber) {
    const invoiceParams = {invoiceCode,invoiceNumber}
    return new Promise((resolve, reject)=>{
        my.request({
            url: `${getApp().domain}/fmSailsStatistics.php`,
            data: {
                action: "queryInvoiceFlowList",
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