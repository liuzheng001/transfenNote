import {verificationPass,refuseverification} from "../../utils/api";

Page({
  data: {
    invoiceParams:null,
  },
  async onLoad(query) {
      console.log("params"+JSON.stringify(query));

      try {
          const app = getApp();              

          if (app.externalParams || query.invoiceFlowId ) { //二维码得到的信息,发票的invoiceFlowId

              //得到当前支付宝的userId
              const userId = await app.getUserId()
              let params = null;
              if (query.invoiceFlowId) {
                  params = {...query,userId: userId,} //mode=check,不判断userId
                  console.log("adf"+JSON.stringify(params))
              }else{
                  params = {...app.externalParams, ...{userId: userId}}
              }
              const invoiceParams = await this.queryUserIdVerification(JSON.stringify(params))
              this.setData({
                  invoiceParams
              })
          }
      }catch (e) {
        //   my.showToast({content:e.message,duration: 3000});
        my.alert({
            content:e.message,
            success:()=>{
                const app = getApp();
                my.reLaunch({
                    url:`/pages/index/index?invoiceCode=${app.externalParams.invoiceCode}&invoiceNumber=${app.externalParams.invoiceNumber}`
                })
            }
        });

      }

  },
  async  verification() {

     my.confirm({
          itle: '提示',
          content: '验证确认',
          confirmButtonText: '通过',
         cancelButtonText:'拒绝',
          success:  async  (result)=>
           {
               if (result.confirm == true) {
                  try {
                          const result = await verificationPass(JSON.stringify(this.data.invoiceParams))
                          if (result  === true) {
                              my.showToast({content: "流转成功"});
                          }

                  }catch (e) {
                      my.showToast({content:e.message});

                  }
              }else{ //拒绝,将删除该流转记录,该记录后台被删除,但在前台通过缓存保留,只保留一个,后来的替代
                  try {
                          const result = await refuseverification(JSON.stringify(this.data.invoiceParams))
                          if (result  === true) {
                              my.alert({content: "中止流转"});
                          }

                  }catch (e) {
                      my.showToast({content:e.message});

                  }
              }
              // console.log(JSON.stringify(app.externalParams))
               my.reLaunch({
                   url:`/pages/index/index?invoiceCode=${this.data.invoiceParams.invoiceCode}&invoiceNumber=${this.data.invoiceParams.invoiceNumber}`
               })
          },
          fail: () => {
          }
      });

    },

    /***
     * 从Fm判断该userid是否有验证权限,若有则展示验证页,返回相关数据
     *
     * @param invoiceFlowId,userId,向后台传递
     * @returns {Promise<void>},resolve返回invoiceFlowId,发票流转Id
     */
    queryUserIdVerification(params) {
        console.log("mode"+params)
        return new Promise((resolve, reject)=>{
            my.request({
                url: `http://r1w8478651.imwork.net:9998/eapp-corp/fmSailsStatistics.php`,
                data: {
                    action: "queryUserIdVerifaction",
                    params,

                },
                success: (res) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }else{
                        reject({message:res.data.Message})
                    }
                },
                fail: (error) => {
                    reject({
                        message: '验证权限异常'+JSON.stringify(error)
                    });
                }
            });
        });
    },

});


