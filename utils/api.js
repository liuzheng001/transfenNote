/**
 * JSAPI getAuthCode
 */
export function getAuthCode(scopes) {
  return new Promise((resolve, reject) => {
    my.getAuthCode({
      scopes,
      success: (res) => {
        resolve(res.authCode);
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * 获取用户信息，如user_id
 */
export function getUserInfo(authCode) {
  return new Promise((resolve, reject) => {
    const url = `${getApp().domain}/ailiController-php/aop/controller/getUserIdForInvoiceTransferController.php`;
    my.request({
      url,
      data: {
        authCode,
      },
      success: (res) => {
        if (!res.data.success) {
          reject(res);
        }
        resolve(res.data);
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
}


/**
 * 客户列表接口
 * @param {String} action:'getcustomlist'
 * return 所有客户列表
 */
export function getCustomList() {
    return new Promise((resolve, reject)=>{
        const url = `${getApp().domain}/getFmMessage.php`;
        my.request({
            url: url,
            method: 'get',
            data: {
                action:'getcustomlist',
            },
            dataType: 'json',
            success: (res) => {
                resolve(res.data.content.data);
            },
            fail: (res) => {
                reject(res);
            },
        })
    })
}

/***
 * 向Fm申请验证通过
 * @param invoiceFlowId向后台传递
 * @returns {Promise<void>},success or failure
 */
export  function verificationPass(invoiceParams) {
    return new Promise((resolve, reject)=>{
        my.request({
            url: `${getApp().domain}/fmSailsStatistics.php`,
            data: {
                action: "verificationPass",
                invoiceParams,
            },
            success: (res) => {
                if (res.data.success) {
                    resolve(true);
                }else{
                    reject({message:res.data.Message})
                }
            },
            fail: (error) => {
                reject({
                    message: '验证通过异常'+JSON.stringify(error)
                });
            }
        });
    });
}

/***
 * 向Fm申请验证拒绝,将删除该记录
 * @param
 * @returns {Promise<void>},success or failure
 */
export  function refuseverification(invoiceParams) {
    return new Promise((resolve, reject)=>{
        my.request({
            url: `${getApp().domain}/fmSailsStatistics.php`,
            data: {
                action: "refuseverification",
                invoiceParams,
            },
            success: (res) => {
                if (res.data.success) {
                    resolve(true);
                }else{
                    reject({message:res.data.Message})
                }
            },
            fail: (error) => {
                reject({
                    message: '验证通过异常'+JSON.stringify(error)
                });
            }
        });
    });
}










