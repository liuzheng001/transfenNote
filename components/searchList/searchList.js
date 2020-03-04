Component({
  mixins: [],
  data: {
      // 搜索框状态
      lostFocus:true,
      inputStatus:{
        marginRight:"-80rpx",
        opacity:0
      },
      //显示结果view的状态
      viewShowed: false,
      // 搜索框值
      inputVal: "",
      //搜索渲染推荐数据
      searchList: [],
      x:3
  },
  props: {
      customList: [],
      onCustomListIndex:(data)=>{
          console.log(data);
      }
  },
  didMount() {

  },
  didUpdate() {},
  didUnmount() {},
  methods: {
      // 显示搜索框取消,得到焦点
      showCancel: function () {
          this.setData({
              lostFocus:false,
              inputStatus: {
                  marginRight: "0",
                  opacity: 1
              }
          });
      },
      //失去搜索框焦点
      onBlur: function () {
          this.setData({
              lostFocus:true,
              inputStatus: {
                  marginRight: "-80rpx",
                  opacity: 0,
              }
          });
      },
      // 点击搜索框取消
      clearSearch: function () {
          this.setData({
              inputVal: "",
              inputStatus: {
                  marginRight: "-80rpx",
                  opacity: 0,
              }
          });
      },
      // 搜索框输入值更新
      onInput: function (e) {
          const searchList = showSearchList(this.props.customList,e.detail.value);
          // debugger;
          this.setData({
              inputVal: e.detail.value,
              searchList:searchList
          });
      },
      //将搜索cell,更新到搜索框
      getSearchCell(e){
          const cellValue = e.currentTarget.dataset.name;
          const customId = e.currentTarget.dataset.customId;

          this.setData({
              lostFocus:true,
              inputStatus: {
                  marginRight: "-80rpx",
                  opacity: 0,
              },
              inputVal:cellValue,
          });
          //将数据传给外部组件或page,通过props,函数方式,注意要加on
          this.props.onCustomListIndex(customId,cellValue)
      },

  },
});

function showSearchList(allList,query) { //原始数据
    var searchList=allList.filter(function (item) {//利用filter具有筛选和截取的作用，筛选出数组中name值与文本框输入内容是否有相同的字
        return item.name.indexOf(query)>-1;//索引name
    });
    return searchList;
}