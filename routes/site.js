'use strict';

var express = require('express');
var router = express.Router();

var variable = require('../extra/variable');
var Paging = require('../extra/paging');
var db = require('../config/query.js');

module.exports = Route;

function Route() {
	var self = this;

	this.index = function (req, res) {
		db.getRak().then(function (data) {
			db.getBerandaData().then(function (results) {
				res.render('./dashboard/index', {
					title: 'Beranda',
					path: variable.nav,
					currentPage: req.path,
					menuActive: '/',
					data_sm: results[0],
					data_sk: results[1],
					data_sm_count: results[2],
					data_sk_count: results[3],
					data_rak: data
				});
			});
		});
	};

	this.suratMasuk = function (req, res) {
		db.countInbox().then(function (inboxCount) {
			var paging = new Paging();

			var pageObj = {
				page: req.param('page'),
				path: req.path,
				totalResult: inboxCount
			};

			var pageResult = paging.getPage(pageObj);
			var currentPage = req.path;

			db.getInboxLimit(pageResult).then(function (inbox) {
				res.render('./surat-masuk/index', {
					title: 'Surat Masuk',
					path: variable.nav,
					currentPage: currentPage,
					menuActive: '/surat-masuk',
					data: inbox,
					data_rak: {},
					pages: pageResult.page,
					pageActive: pageResult.activePage
				});
			});
		});
	};
}
