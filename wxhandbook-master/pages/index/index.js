// index.js
var app = getApp();
var rawlist = wx.getStorageSync('cashflow') || [];

Page({
  data: {
    list: rawlist,
    modalHidden1: true,
    modalHidden2: true,
    temptitle: '',
    tempindex: null,
    userInfo: {
      avatarUrl: '',
      nickName: ''
    },
    hasUserInfo: false, // 是否已获取用户信息
    showConfirmButton: true // 确认按钮一开始显示
  },

  //只在第一次加载页面时使用
  onLoad: function () {
    this.refreshList();
  },
  //每次显示页面都调用该函数
  onShow: function () {
    this.refreshList();
  },

  refreshList: function () {
    //获取本地数据并刷新页面数据
    rawlist = wx.getStorageSync('cashflow') || [];
    this.setData({
      list: rawlist
    });
  },

  // 用户选择头像
  onChooseAvatar: function (e) {
    const { avatarUrl } = e.detail;
    this.setData({
      ['userInfo.avatarUrl']: avatarUrl
    });
  },

  // 输入或选择昵称
  changeNickName: function (e) {
    const nickName = e.detail.value || ''; 
    this.setData({
      ['userInfo.nickName']: nickName,
      showConfirmButton: true // 显示确认按钮
    });
  },

  // 失去焦点时，更新昵称但不隐藏输入框
  onNickNameBlur: function (e) {
    const nickName = e.detail.value || this.data.userInfo.nickName;
    if (nickName) {
      this.setData({
        ['userInfo.nickName']: nickName
      });
    }
  },

  // 点击确认按钮，保存昵称并隐藏输入框
  confirmNickName: function () {
    const nickName = this.data.userInfo.nickName || '';
    //nickName中有数据，保存昵称并隐藏输入框，否则输出提示
    if (nickName) {
      this.setData({
        hasUserInfo: true,
        showConfirmButton: false, // 隐藏确认按钮
        ['userInfo.nickName']: nickName // 保存昵称
      });
    } else {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none',
        duration: 2000
      });
    }
  },

  setTitle: function (e) {
    this.setData({
      //trim方法用于去除字符串两端的空格
      temptitle: e.detail.value.trim()
    });
  },

  // 显示新增账本模态框
  showModal1: function () {
    this.setData({
      modalHidden1: false,
      temptitle: ''
    });
  },

  modalBindaconfirm1: function () {
    // 确保先关闭键盘，避免键盘未收起导致的误判
    wx.hideKeyboard();

    // 延时执行确认逻辑，确保键盘完全关闭后进行检测
    setTimeout(() => {
      //账本名称已输入，则向rawlist中新增一条条目并存储
      if (this.data.temptitle && this.data.temptitle.length > 0) {
        let templist = this.data.list;
        templist.push({
          title: this.data.temptitle,
          id: new Date().getTime(),
          items: []
        });
        rawlist = templist;
        wx.setStorageSync('cashflow', rawlist);
        this.setData({
          modalHidden1: true,
          temptitle: '',
          list: templist
        });
      } else {
        wx.showToast({
          title: '请输入账本名称',
          icon: 'none',
          duration: 2000
        });
      }
    }, 300); // 延时300ms，确保键盘收起
  },

  modalBindcancel1: function () {
    //直接隐藏模态框
    this.setData({ modalHidden1: true });
  },

  // 重命名账本模态框
  showModal2: function (e) {
    let tempindex = e.currentTarget.dataset.index;
    this.setData({
      modalHidden2: false,
      temptitle: this.data.list[tempindex].title,
      tempindex: tempindex
    });
  },

  modalBindaconfirm2: function () {
    wx.hideKeyboard();

    setTimeout(() => {
      if (this.data.temptitle && this.data.temptitle.length > 0) {
        let templist = this.data.list;
        templist[this.data.tempindex].title = this.data.temptitle;
        rawlist = templist;
        wx.setStorageSync('cashflow', rawlist);
        this.setData({
          modalHidden2: true,
          temptitle: '',
          list: templist
        });
      } else {
        wx.showToast({
          title: '请输入新的账本名称',
          icon: 'none',
          duration: 2000
        });
      }
    }, 300); // 延时300ms，确保键盘收起
  },

  modalBindcancel2: function () {
    this.setData({ modalHidden2: true });
  },
  
  //手指触摸动作开始 记录起点X坐标
  //e表示事件对象
  touchstart: function (e) {
    //开始触摸时 重置所有删除
    this.data.list.forEach(function (v, i) {
      if (v.isTouchMove)//只操作为true的
        v.isTouchMove = false
    })
    this.setData({
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY,
      //同步list数据
      list: this.data.list
    })
  },
  //滑动事件处理
  touchmove: function (e) {
    var that = this,
      //获取触摸事件操作的元素
      index = e.currentTarget.dataset.index,//当前索引
      startX = that.data.startX,//开始X坐标
      startY = that.data.startY,//开始Y坐标
      touchMoveX = e.changedTouches[0].clientX,//滑动变化坐标
      touchMoveY = e.changedTouches[0].clientY,//滑动变化坐标
      //获取滑动角度
      angle = that.angle({ X: startX, Y: startY }, { X: touchMoveX, Y: touchMoveY })
    that.data.list.forEach(function (v, i) {
      v.isTouchMove = false
      //滑动超过30度角 return，取消操作
      if (Math.abs(angle) > 30) return
      if (i == index) {
        if (touchMoveX > startX) //右滑
          v.isTouchMove = false
        else //左滑
          v.isTouchMove = true
      }
    })
    //更新数据
    that.setData({
      list: that.data.list
    })
  },
  /**
   * 计算滑动角度
   * @param {Object} start 起点坐标
   * @param {Object} end 终点坐标
   */
  angle: function (start, end) {
    var _X = end.X - start.X,
      _Y = end.Y - start.Y
    //返回角度 /Math.atan()返回数字的反正切值
    return 360 * Math.atan(_Y / _X) / (2 * Math.PI)
  },

  // 删除账本事件
  del: function (e) {
    let index = e.currentTarget.dataset.index;
    let templist = this.data.list;
    templist.splice(index, 1);
    rawlist = templist;
    wx.setStorageSync('cashflow', rawlist);
    this.setData({ list: templist });
    wx.showToast({ title: '删除成功', icon: 'success', duration: 2000 });
  }
});