var app = getApp();
var rawlist = wx.getStorageSync('cashflow') || [];

Page({
  data: {
    mainindex: '',
    typearray: app.globalData.typearray,
    typeindex: '',
    title: '',
    subtitle: '',
    sum: 0,
    persum: 0,
    sublist: []
  },
  onLoad: function (params) {
    // 生命周期函数--监听页面加载
    console.log("加载页面，参数：", params); // 调试信息，检查传递参数是否正确

    // 从页面传递参数中获取 mainindex 和 typeindex
    const mainindex = params.mainindex;
    const typeindex = params.typeindex;

    // 确保 rawlist 中的 mainindex 和 typelist 的 typeindex 有效
    if (!rawlist[mainindex]) {
      console.error("mainindex 无效，无法找到对应的数据");
      return;
    }

    var typelist = wx.getStorageSync('typelist') || [];

    // 初始化页面数据
    this.setData({
      mainindex: mainindex,
      typeindex: typeindex,
      title: rawlist[mainindex].title || '未命名账本',
      subtitle: typelist[typeindex] ? typelist[typeindex].name : '未知类型'
    });

    // 设置页面标题
    wx.setNavigationBarTitle({
      title: this.data.title + ' - ' + this.data.subtitle
    });
  },

  onShow: function () {
    // 生命周期函数--监听页面显示
    console.log("页面显示，更新数据");

    // 重新获取 cashflow 数据
    rawlist = wx.getStorageSync('cashflow') || [];
    
    // 确保 mainindex 和 typeindex 有效
    if (!rawlist[this.data.mainindex]) {
      console.error("onShow 中 mainindex 无效，无法找到对应的数据");
      return;
    }

    // 获取当前账本的条目列表
    var templist = rawlist[this.data.mainindex].items || [];
    var sublist = [];
    var sum = 0;
    var persum = 0;

    // 遍历当前账本的所有条目，筛选出匹配 typeindex 的条目
    for (var i = 0; i < templist.length; i++) {
      if (templist[i].typeindex == this.data.typeindex) {
        sum += parseFloat(templist[i].cost);
        persum += parseFloat(templist[i].cost) / templist[i].member;
        templist[i].id = i; // 保留原始索引
        sublist.push(templist[i]);
      }
    }

    // 更新页面数据
    this.setData({
      sum: sum.toFixed(2),
      persum: persum.toFixed(2),
      sublist: sublist
    });
  },

  //手指触摸动作开始 记录起点X坐标
  touchstart: function (e) {
    // 开始触摸时重置所有删除
    this.data.sublist.forEach(function (v) {
      if (v.isTouchMove) v.isTouchMove = false; // 只操作为 true 的项目
    });

    this.setData({
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY,
      sublist: this.data.sublist
    });
  },

  //滑动事件处理
  touchmove: function (e) {
    var that = this,
      index = e.currentTarget.dataset.index, // 当前索引
      startX = that.data.startX, // 开始 X 坐标
      startY = that.data.startY, // 开始 Y 坐标
      touchMoveX = e.changedTouches[0].clientX, // 滑动变化 X 坐标
      touchMoveY = e.changedTouches[0].clientY, // 滑动变化 Y 坐标
      angle = that.angle({ X: startX, Y: startY }, { X: touchMoveX, Y: touchMoveY }); // 获取滑动角度

    that.data.sublist.forEach(function (v, i) {
      v.isTouchMove = false; // 重置滑动状态
      if (Math.abs(angle) > 30) return; // 滑动超过 30 度角不进行操作

      if (i == index) {
        if (touchMoveX > startX) v.isTouchMove = false; // 右滑不操作
        else v.isTouchMove = true; // 左滑显示删除
      }
    });

    // 更新页面数据
    that.setData({
      sublist: that.data.sublist
    });
  },

  // 计算滑动角度
  angle: function (start, end) {
    var _X = end.X - start.X,
      _Y = end.Y - start.Y;
    // 返回角度
    return (360 * Math.atan(_Y / _X)) / (2 * Math.PI);
  },

  // 删除事件
  del: function (e) {
    var index = e.currentTarget.dataset.index;

    // 删除原始数据中的对应条目
    rawlist[this.data.mainindex].items.splice(this.data.sublist[index].id, 1);

    // 删除 sublist 中的对应条目
    this.data.sublist.splice(index, 1);

    // 更新页面数据和本地存储
    this.setData({
      sublist: this.data.sublist
    });
    wx.setStorageSync('cashflow', rawlist);

    // 显示成功提示
    wx.showToast({
      title: '删除成功',
      icon: 'success',
      duration: 2000
    });

    // 重新显示页面
    this.onShow();
  }
});
