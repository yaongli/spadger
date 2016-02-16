(function( window, undefined ) {
	define(function(require) {
		var $ = require('jquery');
		$(document).ready(function () {
			window.toggleExpand = function(e) {
				var el = $(e.currentTarget).parent();
				if(el.hasClass('expand')) {
					el.removeClass('expand');
					el.children('ol').hide();
				} else {
					el.addClass('expand');
					el.children('ol').show();
				}
			}

			$('#_optButton').bind('click', function (e) {
				e.stopPropagation();
				$('#_optMenu').show();
			});

			$(document).bind('click', function () {
				$('#_optMenu').hide();
			})

			$('.collapse-handle').bind('click', function () {
				var flag = ($('.app-sidebar').css('width') == '0px');
				$('.icon-chevron-left').toggle();
				$('.icon-chevron-right').toggle();
				flag ? $('.app-sidebar').css('width', 185) : $('.app-sidebar').css('width', 0);
				flag ? $('.collapse-handle').css('left', 185) : $('.collapse-handle').css('left', 1);
				flag ? $('.main').css('padding-left', 190) : $('.main').css('padding-left', 5);
				flag ? $('form').css('width', '') : $('form').css('width', '100%');
			})
		});
	});
})( window );