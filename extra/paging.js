'use strict';

var pagination = require('pagination');

module.exports = Paging;

function Paging() {
	var self = this;

	this.var = {
		nav: [
			{
				caption: 'BERANDA',
				link: '/'
			},
			{
				caption: 'SURAT MASUK',
				link: '/surat-masuk'
			},
			{
				caption: 'SURAT KELUAR',
				link: '/surat-keluar'
			}
		],
		page: {
			limit: 24
		}
	};

	this.getPage = function (pageObj) {
		var pageResult = {};
		var pageActive = 1;
		if (pageObj.page > 1) {
			pageActive = pageObj.page;
		}

		var paginator = new pagination.SearchPaginator({
			prelink: pageObj.path,
			current: pageActive,
			rowsPerPage: self.var.page.limit,
			totalResult: pageObj.totalResult
		});

		paginator.getPaginationData();

		var startPage = (paginator._result.current * self.var.page.limit) - self.var.page.limit;
		var endPage = self.var.page.limit;

		pageResult.startPage = startPage;
		pageResult.endPage = endPage;
		pageResult.activePage = paginator._result.current;
		pageResult.page = paginator._result.range;

		return pageResult;
	};
}
