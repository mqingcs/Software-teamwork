// detail.js
var app = getApp();
var rawlist = wx.getStorageSync('cashflow') || [];

Page({
  data: {
    mainindex: '',
    sum: 0,
    persum: 0,
    sublist: []
  },

  onLoad: function (params) {
    this.setData({
      mainindex: params.index,
    });
  },

  onShow: function () {
    rawlist = wx.getStorageSync('cashflow') || [];
    var sublist = rawlist[this.data.mainindex].items;
    var sum = 0;
    var persum = 0;
    for (var i = 0; i < sublist.length; i++) {
      sum += parseFloat(sublist[i].cost);
      persum += parseFloat(sublist[i].cost) / sublist[i].member;
    }
    this.setData({
      sum: sum.toFixed(2),
      persum: persum.toFixed(2),
      sublist: sublist
    });
  },

  // 删除选项弹窗，绑定到单一的删除按钮
  showDeleteOptions: function () {
    wx.showActionSheet({
      itemList: ['删除整个账本', '清空账本内容'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 删除整个账本
          this.deleteCurrentBook();
        } else if (res.tapIndex === 1) {
          // 仅清空账本内容
          this.clearBookContents();
        }
      },
      fail: (res) => {
        console.log(res.errMsg);
      }
    });
  },

  // 删除整个账本
  deleteCurrentBook: function () {
    wx.showModal({
      title: '删除确认',
      content: '您确定要删除账本吗？这将删除该账本的所有记录。',
      success: (res) => {
        if (res.confirm) {
          rawlist.splice(this.data.mainindex, 1);
          wx.setStorageSync('cashflow', rawlist); // 更新存储

          wx.showToast({
            title: '账本已删除',
            icon: 'success',
            duration: 2000
          });

          // 返回到一级页面并刷新
          wx.navigateBack({
            delta: 1 // 返回一级页面
          });
        }
      }
    });
  },

  // 清空账本内容
  clearBookContents: function () {
    wx.showModal({
      title: '清空确认',
      content: '您确定要清空账本内容吗？这将删除所有账目，但保留账本。',
      success: (res) => {
        if (res.confirm) {
          rawlist[this.data.mainindex].items = []; // 清空账本内容
          wx.setStorageSync('cashflow', rawlist); // 更新存储

          this.setData({
            sum: '0.00',
            persum: '0.00',
            sublist: []
          });

          wx.showToast({
            title: '内容已清空',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },

  // 删除单条账目
  del: function (e) {
    var index = e.currentTarget.dataset.index;
    rawlist[this.data.mainindex].items.splice(index, 1); // 从账本条目中删除
    wx.setStorageSync('cashflow', rawlist); // 更新存储

    wx.showToast({
      title: '成功',
      icon: 'success',
      duration: 2000
    });

    // 更新页面数据
    this.onShow(); // 更新数据
  },

  // 手指触摸动作开始 记录起点X坐标
  touchstart: function (e) {
    this.data.sublist.forEach(function (v, i) {
      if (v.isTouchMove) v.isTouchMove = false;
    });
    this.setData({
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY,
      sublist: this.data.sublist
    });
  },

  // 滑动事件处理
  touchmove: function (e) {
    var that = this,
      index = e.currentTarget.dataset.index,
      startX = that.data.startX,
      startY = that.data.startY,
      touchMoveX = e.changedTouches[0].clientX,
      touchMoveY = e.changedTouches[0].clientY,
      angle = that.angle({ X: startX, Y: startY }, { X: touchMoveX, Y: touchMoveY });

    that.data.sublist.forEach(function (v, i) {
      v.isTouchMove = false;
      if (Math.abs(angle) > 30) return;
      if (i == index) {
        if (touchMoveX > startX) v.isTouchMove = false;
        else v.isTouchMove = true;
      }
    });
    that.setData({
      sublist: that.data.sublist
    });
  },

  // 计算滑动角度
  angle: function (start, end) {
    var _X = end.X - start.X,
      _Y = end.Y - start.Y;
    return (360 * Math.atan(_Y / _X)) / (2 * Math.PI);
  },
});
