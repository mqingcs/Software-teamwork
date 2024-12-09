// settings.js
// 获取应用实例
var app = getApp()
var typearray = app.globalData.typearray

Page({
    data: {
        modalHidden1: true, // 控制新增账本模态框的显示状态
        temptitle: '',      // 存储输入的账本名称
        list: []
    },

    onLoad: function () {
        // 页面加载时获取存储的账本列表，没有则使用初始类型列表
        const storedList = wx.getStorageSync('typelist') || [];
        if (storedList.length === 0) {
            const initialList = typearray.map((item, index) => ({
                id: index,
                name: item,
                edit: false
            }));
            wx.setStorageSync('typelist', initialList);
            this.setData({
                list: initialList
            });
        } else {
            this.setData({
                list: storedList
            });
        }
    },

    // 显示新增账本模态框
    showModal1: function () {
        this.setData({
            modalHidden1: false,
            temptitle: '' // 清空输入框内容
        });
    },

    // 确认新增账本
    modalBindaconfirm1: function () {
        // 确保先关闭键盘，避免键盘未收起导致的误判
        wx.hideKeyboard();

        // 延时执行确认逻辑，确保键盘完全关闭后进行检测
        setTimeout(() => {
            //账本名称已输入，则向列表中新增一条条目并存储
            if (this.data.temptitle && this.data.temptitle.trim().length > 0) {
                let templist = this.data.list;
                templist.push({
                    name: this.data.temptitle.trim(), // 使用输入的账本名称
                    id: new Date().getTime(),         // 使用时间戳作为唯一ID
                    edit: true
                });

                // 更新本地缓存并刷新页面数据
                wx.setStorageSync('typelist', templist);
                this.setData({
                    modalHidden1: true, // 关闭模态框
                    temptitle: '',      // 清空输入框内容
                    list: templist      // 更新页面数据
                });

                wx.showToast({
                    title: '账本添加成功',
                    icon: 'success',
                    duration: 2000
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

    // 取消新增账本操作
    modalBindcancel1: function () {
        this.setData({
            modalHidden1: true,
            temptitle: '' // 清空输入框内容
        });
    },

    // 输入框内容变化时更新temptitle
    setTitle: function (e) {
        this.setData({
            temptitle: e.detail.value // 实时更新输入内容
        });
    },

    clearAll: function () {
        var that = this;
        wx.showModal({
            title: '警告',
            content: '请确认自建类别未在使用，且删除所有自建分类后无法找回！',
            success: function (res) {
                if (res.confirm) {
                    const initialList = typearray.map((item, index) => ({
                        id: index,
                        name: item,
                        edit: false
                    }));
                    wx.setStorageSync('typelist', initialList);
                    that.setData({
                        list: initialList
                    });
                }
            }
        });
    },

    // 删除账本条目
    del: function (e) {
        const index = e.currentTarget.dataset.index;
        const list = this.data.list;
        
        // 删除选中项
        list.splice(index, 1);

        // 更新数据和缓存
        this.setData({
            list: list
        });
        wx.setStorageSync('typelist', list);

        wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 2000
        });
    },

    // 手势滑动事件，用于显示删除按钮
    touchstart: function (e) {
        this.data.list.forEach(function (v) {
            if (v.isTouchMove) v.isTouchMove = false;
        });
        this.setData({
            startX: e.changedTouches[0].clientX,
            startY: e.changedTouches[0].clientY,
            list: this.data.list
        });
    },
    
    touchmove: function (e) {
        var that = this,
            index = e.currentTarget.dataset.index,
            startX = that.data.startX,
            startY = that.data.startY,
            touchMoveX = e.changedTouches[0].clientX,
            touchMoveY = e.changedTouches[0].clientY,
            angle = that.angle({ X: startX, Y: startY }, { X: touchMoveX, Y: touchMoveY });

        that.data.list.forEach(function (v, i) {
            v.isTouchMove = false;
            if (Math.abs(angle) > 30) return;
            if (i == index) {
                v.isTouchMove = touchMoveX < startX;
            }
        });

        that.setData({
            list: that.data.list
        });
    },

    // 计算滑动角度
    angle: function (start, end) {
        var _X = end.X - start.X,
            _Y = end.Y - start.Y;
        return (360 * Math.atan(_Y / _X)) / (2 * Math.PI);
    }
});
