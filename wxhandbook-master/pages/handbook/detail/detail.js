var util = require('../../../utils/util.js')
var formatLocation = util.formatLocation
var curDate = util.curDate
var app = getApp()
var list = []

Page({
  data: {
    act: 'new',
    isfocus: true,
    numberarray: app.globalData.numberarray,
    numberindex: 0,
    typearray: app.globalData.typearray,
    typeindex: 0,
    mainindex: 0,
    subindex: 0,
    subtitle: '',
    comment: '',
    cost: '',
    date: '2024-11-01',
    time: '12:01',
    hasLocation: false,
    location: {},
    markers: [], // 地图标记
    inidata: {}
  },

  onLoad: function (params) {
    list = wx.getStorageSync('cashflow') || []
    var typelist = wx.getStorageSync('typelist') || []
    var typearray = typelist.length ? typelist.map(item => item.name) : app.globalData.typearray

    // 获取当前位置并设置地图标记
    this.getCurrentLocation()

    if (params.act === 'new') {
      var curdate = curDate(new Date())
      this.setData({
        act: 'new',
        isfocus: true,
        mainindex: params.mainindex,
        typearray: typearray,
        date: curdate[0],
        time: curdate[1]
      })
    } else {
      var billinfo = list[params.mainindex].items[params.subindex]
      this.setData({
        act: 'edit',
        isfocus: false,
        mainindex: params.mainindex,
        subindex: params.subindex,
        numberindex: billinfo.member - 1,
        typeindex: billinfo.typeindex || 0,
        typearray: typearray,
        subtitle: billinfo.subtitle,
        comment: billinfo.comment,
        cost: billinfo.cost,
        date: billinfo.date,
        time: billinfo.time,
        hasLocation: billinfo.hasLocation || false,
        location: billinfo.location,
        markers: billinfo.location ? [{
          id: 1,
          latitude: billinfo.location.latitude,
          longitude: billinfo.location.longitude,
          iconPath: "/pages/common/icon/location.png",
          width: 30,
          height: 30
        }] : [],
        inidata: billinfo
      })
    }
  },

  // 获取当前位置并设置初始标记
  getCurrentLocation: function () {
    const that = this
    wx.getLocation({
      type: 'gcj02', // 使用适用于小程序地图的坐标系
      success(res) {
        that.setData({
          hasLocation: true,
          location: {
            latitude: res.latitude,
            longitude: res.longitude,
            name: "当前位置",
            address: `纬度: ${res.latitude}, 经度: ${res.longitude}`
          },
          markers: [{
            id: 1,
            latitude: res.latitude,
            longitude: res.longitude,
            iconPath: "/pages/common/icon/location.png",
            width: 30,
            height: 30
          }]
        })
      },
      fail() {
        wx.showToast({
          title: '定位权限未授权',
          icon: 'none'
        })
      }
    })
  },

  // 选择位置
  chooseLocation: function () {
    var that = this
    wx.chooseLocation({
      success: function (res) {
        if (res.name || res.address) {
          that.setData({
            hasLocation: true,
            location: {
              name: res.name,
              address: res.address,
              latitude: res.latitude,
              longitude: res.longitude
            },
            markers: [{
              id: 1,
              latitude: res.latitude,
              longitude: res.longitude,
              iconPath: "/pages/common/icon/location.png",
              width: 30,
              height: 30
            }]
          })
        } else {
          that.setData({
            hasLocation: false,
            location: {},
            markers: []
          })
        }
      },
      fail: function () {
        wx.showToast({
          title: '未选择位置',
          icon: 'none'
        })
        that.setData({
          hasLocation: false,
          location: {},
          markers: []
        })
      }
    })
  },
  
  // 直接通过 map 组件选择地点
  chooseLocationFromMap: function (e) {
    const { latitude, longitude } = e.detail
    this.setData({
      hasLocation: true,
      location: {
        name: "自定义位置",
        address: `纬度: ${latitude}, 经度: ${longitude}`,
        latitude,
        longitude
      },
      markers: [{
        id: 1,
        latitude: latitude,
        longitude: longitude,
        iconPath: "/pages/common/icon/location.png",
        width: 30,
        height: 30
      }]
    })
  },

  bindNumberChange: function (e) {
    this.setData({
      numberindex: e.detail.value
    })
  },

  bindTypeArrayChange: function (e) {
    this.setData({
      typeindex: e.detail.value
    })
  },

  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value
    })
  },

  bindTimeChange: function (e) {
    this.setData({
      time: e.detail.value
    })
  },

  formSubmit: function (e) {
    const formData = e.detail.value
    const newEntry = {
      subtitle: formData.title,
      comment: formData.detail,
      cost: parseFloat(formData.cost || '0'),
      date: formData.date,
      time: formData.time,
      member: parseInt(formData.member) + 1,
      typeindex: parseInt(formData.typeindex),
      hasLocation: this.data.hasLocation,
      location: this.data.location
    }

    if (this.data.act === 'new') {
      // 新建条目
      list[this.data.mainindex].items.push(newEntry)
    } else {
      // 编辑已有条目
      list[this.data.mainindex].items[this.data.subindex] = newEntry
    }

    // 按日期和时间排序
    list[this.data.mainindex].items.sort(function (a, b) {
      var d1 = new Date(a.date.replace(/-/g, '/') + ' ' + a.time)
      var d2 = new Date(b.date.replace(/-/g, '/') + ' ' + b.time)
      return d1 - d2
    })

    // 更新存储
    wx.setStorageSync('cashflow', list)
    wx.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 2000
    })
    wx.navigateBack({
      delta: 1
    })
  },

  formReset: function () {
    if (this.data.act === 'new') {
      // 重置到新建状态
      const curdate = curDate(new Date())
      this.setData({
        subtitle: '',
        comment: '',
        cost: '',
        date: curdate[0],
        time: curdate[1],
        numberindex: 0,
        typeindex: 0,
        hasLocation: false,
        location: {}
      })
    } else {
      // 重置到原始编辑状态
      const billinfo = this.data.inidata
      this.setData({
        numberindex: billinfo.member - 1,
        typeindex: billinfo.typeindex || 0,
        subtitle: billinfo.subtitle,
        comment: billinfo.comment,
        cost: billinfo.cost,
        date: billinfo.date,
        time: billinfo.time,
        hasLocation: billinfo.hasLocation || false,
        location: billinfo.location
      })
    }
  }
})
