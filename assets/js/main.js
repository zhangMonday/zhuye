var iUp = (function () {
	var time = 0,
		duration = 150,
		clean = function () {
			time = 0;
		},
		up = function (element) {
			setTimeout(function () {
				element.classList.add("up");
			}, time);
			time += duration;
		},
		down = function (element) {
			element.classList.remove("up");
		},
		toggle = function (element) {
			setTimeout(function () {
				element.classList.toggle("up");
			}, time);
			time += duration;
		};
	return {
		clean: clean,
		up: up,
		down: down,
		toggle: toggle
	};
})();

// 同源壁纸：由 GitHub Action 每天更新（国内可直连，不依赖 Bing）
var LOCAL_WALLPAPER = "./assets/img/bing.jpg";
// 最终的兜底壁纸：仓库自带，永远存在
var FALLBACK_WALLPAPER = "./assets/img/home.jpg";
// Bing 壁纸主机候选，按可用性依次尝试（cn.bing.com 不会再 301 跳转）
var BING_HOSTS = ["https://cn.bing.com", "https://www.bing.com", "https://www.cn.bing.com"];
var IMAGE_TIMEOUT = 8000;

/**
 * 把图片设置为面板背景
 * @returns {boolean} 是否设置成功
 */
function setPanelBackground(url) {
	var panel = document.querySelector('#panel');
	if (!panel || !url) return false;
	panel.style.background = "url('" + url + "') center center no-repeat #666";
	panel.style.backgroundSize = "cover";
	return true;
}

/**
 * 预加载一张图片，加载成功/失败/超时都会结束
 */
function preloadImage(url, timeout) {
	return new Promise(function (resolve, reject) {
		var img = new Image();
		var timer = setTimeout(function () {
			img.onload = img.onerror = null;
			img.src = "";
			reject(new Error("timeout"));
		}, timeout || IMAGE_TIMEOUT);
		img.onload = function () {
			clearTimeout(timer);
			resolve(url);
		};
		img.onerror = function () {
			clearTimeout(timer);
			reject(new Error("error"));
		};
		img.src = url;
	});
}

/**
 * 依次尝试多个地址，返回第一个加载成功的地址（都失败则返回 null）
 */
function firstReachable(urls, timeout, done) {
	var i = 0;
	(function next() {
		if (i >= urls.length) return done(null);
		var url = urls[i++];
		preloadImage(url, timeout).then(function () {
			done(url);
		}, next);
	})();
}

function getBingImages(imgUrls) {
	/**
	 * 获取Bing壁纸
	 * 先使用 GitHub Action 每天获取 Bing 壁纸 URL 并更新 images.json 文件
	 * 然后读取 images.json 文件中的数据
	 *
	 * 页面背景在 main.js 加载时就已经用同源壁纸铺好了，
	 * 这里只是尝试换成当天的 Bing 壁纸，任何一步失败都不会让背景变空。
	 */
	if (!imgUrls || !imgUrls.length) return;

	var indexName = "bing-image-index";
	var index = NaN;
	try {
		index = parseInt(sessionStorage.getItem(indexName), 10);
	} catch (e) { /* 隐私模式下可能不可用 */ }
	if (isNaN(index) || index >= imgUrls.length - 1) index = 0;
	else index++;
	try {
		sessionStorage.setItem(indexName, index);
	} catch (e) { /* 忽略 */ }

	var imgUrl = imgUrls[index];
	if (typeof imgUrl !== "string" || imgUrl.charAt(0) !== "/") return;

	var urls = [];
	for (var i = 0; i < BING_HOSTS.length; i++) {
		urls.push(BING_HOSTS[i] + imgUrl);
	}
	firstReachable(urls, IMAGE_TIMEOUT, function (ok) {
		if (ok) setPanelBackground(ok);
	});
}

// 立即用同源壁纸铺满背景（不等待任何网络请求），保证背景图永远不空
(function () {
	setPanelBackground(LOCAL_WALLPAPER);
	// 同源壁纸不存在时（例如 Action 尚未跑过），退回到仓库自带图片
	preloadImage(LOCAL_WALLPAPER, IMAGE_TIMEOUT).then(null, function () {
		preloadImage(FALLBACK_WALLPAPER, IMAGE_TIMEOUT).then(function (url) {
			setPanelBackground(url);
		}, null);
	});
})();

function decryptEmail(encoded) {
	var address = atob(encoded);
	window.location.href = "mailto:" + address;
}

document.addEventListener('DOMContentLoaded', function () {
	// 获取一言数据
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			var res = JSON.parse(this.responseText);
			document.getElementById('description').innerHTML = res.hitokoto + "<br/> -「<strong>" + res.from + "</strong>」";
		}
	};
	xhr.open("GET", "https://v1.hitokoto.cn", true);
	xhr.send();

	var iUpElements = document.querySelectorAll(".iUp");
	iUpElements.forEach(function (element) {
		iUp.up(element);
	});

	var avatarElement = document.querySelector(".js-avatar");
	avatarElement.addEventListener('load', function () {
		avatarElement.classList.add("show");
	});
});

var btnMobileMenu = document.querySelector('.btn-mobile-menu__icon');
var navigationWrapper = document.querySelector('.navigation-wrapper');

btnMobileMenu.addEventListener('click', function () {
	if (navigationWrapper.style.display == "block") {
		navigationWrapper.addEventListener('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
			navigationWrapper.classList.toggle('visible');
			navigationWrapper.classList.toggle('animated');
			navigationWrapper.classList.toggle('bounceOutUp');
			navigationWrapper.removeEventListener('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', arguments.callee);
		});
		navigationWrapper.classList.toggle('animated');
		navigationWrapper.classList.toggle('bounceInDown');
		navigationWrapper.classList.toggle('animated');
		navigationWrapper.classList.toggle('bounceOutUp');
	} else {
		navigationWrapper.classList.toggle('visible');
		navigationWrapper.classList.toggle('animated');
		navigationWrapper.classList.toggle('bounceInDown');
	}
	btnMobileMenu.classList.toggle('social');
	btnMobileMenu.classList.toggle('iconfont');
	btnMobileMenu.classList.toggle('icon-list');
	btnMobileMenu.classList.toggle('social');
	btnMobileMenu.classList.toggle('iconfont');
	btnMobileMenu.classList.toggle('icon-angleup');
	btnMobileMenu.classList.toggle('animated');
	btnMobileMenu.classList.toggle('fadeIn');
});
