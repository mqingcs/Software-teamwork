var app = getApp();
var list = [];
var wxCharts = require('../../../utils/wxcharts.js');
var pieChart = null;

Page({
  data: {
    mainindex: '',
    points: [],
    sum: 0,
    persum: 0,
    series: [],
    latitude: 39.984519, // 设置默认值
    longitude: 116.307793, // 设置默认值
    polyline: [],
    markers: [],
    typearray: [] // 将 typearray 移到 data 中
  },

  onLoad: function (params) {
    // 页面加载时初始化 typearray
    const typelist = wx.getStorageSync('typelist') || [];
    let typearray = [];
    if (typelist.length === 0) {
      typearray = app.globalData.typearray || [];
    } else {
      for (let i = 0; i < typelist.length; i++) {
        typearray.push(typelist[i].name);
      }
    }

    // 更新 typearray 和 mainindex
    this.setData({
      mainindex: params.mainindex,
      typearray: typearray
    });

    console.log("onLoad 中的 typearray:", this.data.typearray); // 调试信息
  },

  onShow: function () {
    list = wx.getStorageSync('cashflow') || [];
    if (this.data.mainindex == null || this.data.mainindex >= list.length) {
      console.error("mainindex 无效或超出范围");
      return;
    }

    var sublist = list[this.data.mainindex].items || [];
    var sum = 0;
    var persum = 0;
    var points = [];
    var series = [];
    var tempseries = new Array(this.data.typearray.length).fill(0); // 初始化为零的数组
    var hasLocation = false;
    var midlatitude = 0;
    var midlongitude = 0;

    // 计算总金额和消费分类金额
    for (var i = 0; i < sublist.length; i++) {
      sum += parseFloat(sublist[i].cost);
      persum += parseFloat(sublist[i].cost) / sublist[i].member;

      if (sublist[i].location && sublist[i].location.latitude && sublist[i].location.longitude) {
        points.push({
          latitude: sublist[i].location.latitude,
          longitude: sublist[i].location.longitude,
          name: sublist[i].location.name
        });
      }
      tempseries[sublist[i].typeindex] += parseFloat(sublist[i].cost);
      if (sublist[i].hasLocation) {
        hasLocation = true;
      }
    }

    // 生成 series 数据用于绘制饼图
    for (var i = 0; i < tempseries.length; i++) {
      if (tempseries[i] !== 0) {
        series.push({
          name: this.data.typearray[i],
          data: tempseries[i],
          id: i
        });
      }
    }

    // 设置中间点的经纬度
    if (hasLocation && sublist[parseInt(sublist.length / 2)].location) {
      midlatitude = sublist[parseInt(sublist.length / 2)].location.latitude;
      midlongitude = sublist[parseInt(sublist.length / 2)].location.longitude;
    } else {
      wx.getLocation({
        type: 'wgs84',
        success: (res) => {
          this.setData({
            latitude: res.latitude,
            longitude: res.longitude
          });
          console.log("Location set to:", res.latitude, res.longitude);
        },
        fail: (error) => {
          console.error("Location access denied:", error);
        }
      });
    }

    // 更新地图和饼图数据
    this.setData({
      sum: sum.toFixed(2),
      persum: persum.toFixed(2),
      series: series,
      points: points,
      latitude: midlatitude || this.data.latitude,
      longitude: midlongitude || this.data.longitude,
      polyline: [{
        points: points,
        color: "#5c95e6FF",
        width: 8,
        dottedLine: false
      }],
      markers: points
    });

    if (series.length === 0) {
      series.push({
        name: '无',
        data: 1
      });
    }

    // 绘制饼图
    this.createPieChart(series);
  },

  // 创建饼图
  createPieChart: function (series) {
    let windowWidth = 320; // 设置默认宽度
    try {
      windowWidth = wx.getSystemInfoSync().windowWidth * 0.96; // 获取屏幕宽度并设置饼图宽度
    } catch (e) {
      console.error("获取系统信息失败，使用默认宽度：", e);
    }

    pieChart = new wxCharts({
      animation: true,
      canvasId: 'pieCanvas',
      type: 'pie',
      series: series,
      width: windowWidth,
      height: 300,
      dataLabel: true
    });
  },

  // 点击饼图的处理函数
  touchHandler: function (e) {
    var index = pieChart.getCurrentDataIndex(e);

    // 如果点击的是空白处，index 会是 -1
    if (index === -1) {
      console.log("点击了空白处，没有触发跳转"); // 调试信息
      return;
    }

    var mainindex = this.data.mainindex;
    var typeindex = this.data.series[index]?.id;

    // 确保 typeindex 有效
    if (typeindex === undefined) {
      console.error("未能获取到有效的 typeindex");
      return;
    }

    // 获取当前类型的所有相关记录
    const filteredItems = list[mainindex].items.filter(item => item.typeindex === typeindex);

    // 跳转到子列表页面，传递对应的类型记录
    wx.navigateTo({
      url: '../sublist/sublist?mainindex=' + mainindex + '&typeindex=' + typeindex,
      success: function (res) {
        console.log("成功跳转到子列表页面");
      },
      fail: function () {
        console.error("跳转到子列表页面失败");
      }
    });
  },

  // 导出报表的代码保持不变
  exportReport: function () {
    console.log("导出报表按钮已点击"); // 添加调试信息
    const sublist = list[this.data.mainindex]?.items || [];
    if (!sublist.length) {
      wx.showToast({ title: '没有数据可导出', icon: 'none' });
      console.log("没有找到要导出的数据"); // 调试信息
      return;
    }

    // 定义 CSV 标题行，新增经纬度和地址信息
    let csvContent = '标题,消费类型,备注,花费费用,时间,消费人数,地址\n';
    console.log("开始生成 CSV 内容"); // 调试信息

    // 将数据转换为 CSV 格式
    sublist.forEach(item => {
      const title = item.subtitle || ''; // 标题
      const typeIndex = Number.isInteger(item.typeindex) && item.typeindex >= 0 && item.typeindex < this.data.typearray.length
        ? item.typeindex : null; // 检查 typeindex 的有效性
      const type = typeIndex !== null ? this.data.typearray[typeIndex] : '未知类型'; // 根据索引获取消费类型，默认为 '未知类型'
      const comment = item.comment || ''; // 备注
      const cost = item.cost || 0; // 花费费用
      const time = `${item.date || ''} ${item.time || ''}`; // 时间
      const memberCount = item.member || 1; // 消费人数
      const address = item.location?.address || ''; // 地址

      csvContent += `${title},${type},${comment},${cost},${time},${memberCount},${address}\n`;
    });

    console.log("CSV 内容生成完毕：", csvContent); // 调试信息

    // 定义文件路径
    const fileSystemManager = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/report.csv`;
    console.log("文件路径为：", filePath); // 调试信息

    // 将 CSV 内容写入文件
    fileSystemManager.writeFile({
      filePath: filePath,
      data: csvContent,
      encoding: 'utf8',
      success: () => {
        console.log("文件写入成功"); // 调试信息
        wx.showToast({ title: '文件已保存' });
          // 直接尝试打开文件
          wx.openDocument({
            filePath: filePath,
            fileType: 'csv',
            success: () => {
              wx.showToast({ title: '文件打开成功', icon: 'success' })
              console.log("文件打开成功"); // 调试信息
            },
            fail: (err) => {
              wx.showToast({ title: '无法直接打开文件，请尝试分享', icon: 'none' })
              console.error("文件打开失败", err) // 调试信息
    
              // 如果无法直接打开文件，提示用户分享
              wx.showModal({
                title: '文件已保存',
                content: '文件已保存为 report.csv，您可以选择分享文件以便查看。',
                confirmText: "分享文件",
                cancelText: "关闭",
                success: (res) => {
                  if (res.confirm) {
                    wx.shareFileMessage({
                      filePath: filePath,
                      success: () => {
                        wx.showToast({ title: '文件已分享', icon: 'success' })
                      },
                      fail: err => {
                        wx.showToast({ title: '分享失败', icon: 'none' })
                        console.error("文件分享失败", err)
                      }
                    })
                  }
                }
              })
            }
          })
      },
      fail: err => {
        wx.showToast({ title: '导出失败', icon: 'none' });
        console.error('文件写入失败：', err);
      }
    });
  }
});
