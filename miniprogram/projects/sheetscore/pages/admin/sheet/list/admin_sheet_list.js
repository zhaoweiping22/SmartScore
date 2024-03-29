const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const SheetBiz = require('../../../../biz/sheet_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const projectSetting = require('../../../../public/project_setting.js');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		if (!AdminBiz.isAdmin(this)) return;

		wx.setNavigationBarTitle({
			title: projectSetting.SHEET_NAME + '-管理',
		});
		this.setData({
			SHEET_NAME: projectSetting.SHEET_NAME
		});

		//设置搜索菜单
		this._getSearchMenu();

	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () { },

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: async function () { },

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () { },

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () { },

	url: async function (e) {
		pageHelper.url(e, this);
	},

	bindCommListCmpt: function (e) {
		pageHelper.commListListener(this, e);
	},

	bindEditTap: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;
		let itemList = ['编辑','复制信息并创建新的项目'];

		let id = pageHelper.dataset(e, 'id');  
		let idx = pageHelper.dataset(e, 'idx');
		wx.showActionSheet({
			itemList,
			success: async res => {
				switch (res.tapIndex) {
					case 0: { 
						wx.navigateTo({
							url: '../edit/admin_sheet_edit?id=' + id + '&idx=' + idx,
						});
						break;
					}
					case 1: { 
						wx.navigateTo({
							url: '../add/admin_sheet_add?idx=' + idx,
						});
						break;
					}
				 
				}
			},
			fail: function (res) { }
		})
	},

	bindDataTap: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;
		let itemList = ['数据列表','数据导入', '导出数据Excel表格', '清空数据'];

		let id = pageHelper.dataset(e, 'id');  
		let idx = pageHelper.dataset(e, 'idx');
		wx.showActionSheet({
			itemList,
			success: async res => {
				switch (res.tapIndex) {
					case 0: { 
						wx.navigateTo({
							url: '../data_list/admin_sheet_data_list?id=' + id + '&idx=' + idx,
						});
						break;
					}
					case 1: { 
						wx.navigateTo({
							url: '../import/admin_sheet_import?id=' + id + '&idx=' + idx,
						});
						break;
					}
					case 2: {
						wx.navigateTo({
							url: '../export/admin_sheet_export?id=' + id + '&idx=' + idx,
						});
						break;
					}
					case 3: {
						this._clear(e);
						break;
					}
				}
			},
			fail: function (res) { }
		})
	},

	_clear: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;
		let id = pageHelper.dataset(e, 'id');

		let params = {
			id
		}

		let callback = async () => {
			try {
				let opts = {
					title: '处理中'
				}
				await cloudHelper.callCloudSumbit('admin/sheet_clear', params, opts).then(res => {
					let node = {
						'SHEET_DATA_CNT': 0,
					}
					pageHelper.modifyPrevPageListNodeObject(id, node, 1);

					pageHelper.showSuccToast('清空完成');
				});
			} catch (err) {
				console.log(err);
			}
		}
		pageHelper.showConfirm('确认清空所有数据？清空后不可恢复', callback);

	},

	bindStatusMoreTap: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;
		let itemList = ['启用', '停用 (不显示)', '删除'];
		wx.showActionSheet({
			itemList,
			success: async res => {
				switch (res.tapIndex) {
					case 0: { //启用
						e.currentTarget.dataset['status'] = 1;
						await this._setStatus(e);
						break;
					}
					case 1: { //停止 
						e.currentTarget.dataset['status'] = 0;
						await this._setStatus(e);
						break;
					}
					case 2: { //删除
						await this._del(e);
						break;
					}
				}
			},
			fail: function (res) { }
		})
	},

	bindMoreTap: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;
		let idx = pageHelper.dataset(e, 'idx');

		let order = this.data.dataList.list[idx].SHEET_ORDER;
		let orderDesc = (order == 0) ? '取消置顶' : '置顶'; 

		let itemList = ['预览', orderDesc, '生成专属二维码'];

		wx.showActionSheet({
			itemList,
			success: async res => {
				switch (res.tapIndex) {
					case 0: { //预览
						let id = pageHelper.dataset(e, 'id');
						wx.navigateTo({
							url: '../../../sheet/detail/sheet_detail?id=' + id,
						});
						break;
					} 
					case 1: { //置顶 
						let sort = (order == 0) ? 9999 : 0;
						e.currentTarget.dataset['sort'] = sort;
						await this._setSort(e);
						break;
					}
					case 2: { //二维码 
						let title = encodeURIComponent(pageHelper.dataset(e, 'title'));
						let qr = encodeURIComponent(pageHelper.dataset(e, 'qr'));
						wx.navigateTo({
							url: `../../setup/qr/admin_setup_qr?title=${title}&qr=${qr}`,
						})
						break;
					}
				}


			},
			fail: function (res) { }
		})
	},

	_setSort: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;

		let id = pageHelper.dataset(e, 'id');
		let sort = pageHelper.dataset(e, 'sort');
		if (!id) return;

		let params = {
			id,
			sort
		}

		try {
			await cloudHelper.callCloudSumbit('admin/sheet_sort', params).then(res => {
				pageHelper.modifyListNode(id, this.data.dataList.list, 'SHEET_ORDER', sort);
				this.setData({
					dataList: this.data.dataList
				});
				pageHelper.showSuccToast('设置成功');
			});
		} catch (err) {
			console.log(err);
		}
	}, 

	_del: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;
		let id = pageHelper.dataset(e, 'id');

		let params = {
			id
		}

		let callback = async () => {
			try {
				let opts = {
					title: '删除中'
				}
				await cloudHelper.callCloudSumbit('admin/sheet_del', params, opts).then(res => {
					pageHelper.delListNode(id, this.data.dataList.list, '_id');
					this.data.dataList.total--;
					this.setData({
						dataList: this.data.dataList
					});
					pageHelper.showSuccToast('删除成功');
				});
			} catch (err) {
				console.log(err);
			}
		}
		pageHelper.showConfirm('确认删除？删除后记录数据将一并删除且不可恢复', callback);

	},

	_setStatus: async function (e) {
		if (!AdminBiz.isAdmin(this)) return;
		let id = pageHelper.dataset(e, 'id');
		let status = Number(pageHelper.dataset(e, 'status'));
		let params = {
			id,
			status
		}

		try {
			await cloudHelper.callCloudSumbit('admin/sheet_status', params).then(res => {
				pageHelper.modifyListNode(id, this.data.dataList.list, 'SHEET_STATUS', status, '_id');
				pageHelper.modifyListNode(id, this.data.dataList.list, 'statusDesc', res.data.statusDesc, '_id');
				this.setData({
					dataList: this.data.dataList
				});
				pageHelper.showSuccToast('设置成功');
			});
		} catch (err) {
			console.log(err);
		}
	},

	_getSearchMenu: function () {
		let cateIdOptions = SheetBiz.getCateList();

		let sortItem1 = [{ label: '分类', type: '', value: 0 }];
		sortItem1 = sortItem1.concat(cateIdOptions);

		let sortItem2 = [
			{ label: '排序', type: '', value: 0 },
			{ label: '按记录数倒序', type: 'sort', value: 'SHEET_DATA_CNT|desc' },
			{ label: '按记录数正序', type: 'sort', value: 'SHEET_DATA_CNT|asc' },
		];

		let sortItems = [];
		if (sortItem1.length > 2) sortItems.push(sortItem1);
		sortItems.push(sortItem2);

		let sortMenus = [
			{ label: '全部', type: '', value: '' },
			{ label: '正常', type: 'status', value: 1 },
			{ label: '停用', type: 'status', value: 0 },
			{ label: '最新', type: 'sort', value: 'new' }, 
			{ label: '置顶', type: 'top', value: 'top' },
		]
		this.setData({
			search: '',
			cateIdOptions,
			sortItems,
			sortMenus,
			isLoad: true
		})
	}

})