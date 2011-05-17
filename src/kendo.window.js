﻿(function ($, window) {
    var kendo = window.kendo,
        Component = kendo.ui.Component,
        Draggable = kendo.ui.Draggable,
        fx = kendo.fx,
        //events
        OPEN = "open",
        ACTIVATE = "activate",
        CLOSE = "close",
        REFRESH = "refresh",
        RESIZE = "resize",
        ERROR = "error",
        LOAD = "load",
        MOVE = "move"

    function isLocalUrl(url) {
        return url && !(/^([a-z]+:)?\/\//i).test(url);
    }

    function fixIE6Sizing(wrapper) {
        if ($.browser.msie && $.browser.version < 7) {
            wrapper
                .find(".t-resize-e,.t-resize-w").css("height", wrapper.height()).end()
                .find(".t-resize-n,.t-resize-s").css("width", wrapper.width()).end()
                .find(".t-overlay").css({ width: wrapper.width(), height: wrapper.height() });
        }
    }

    function Window(element, options) {
        var that = this;
        Component.apply(that, arguments);
        that.options = options = $.extend({}, that.options, options);

        if (!that.element.is(".t-content")) {
            that.element.addClass("t-window-content t-content");
            Window.create(that.element, options);
            that.wrapper = that.element.closest(".t-window");

            var titleBar = that.wrapper.find(".t-window-titlebar");
            titleBar.css("margin-top", -titleBar.outerHeight());

            that.wrapper.css("padding-top", titleBar.outerHeight());

            if (options.width) {
                that.wrapper.width(options.width);
            }

            if (options.height) {
                that.wrapper.height(options.height)
            }

            if (!options.visible) {
                that.wrapper.hide();
            }
        }

        if (!that.wrapper.parent().is("body")) {
            var offset;

            if (that.wrapper.is(":visible")) {
                offset = that.wrapper.offset();
                that.wrapper.css({ top: offset.top, left: offset.left });
            } else {
                that.wrapper.css({ visibility: "hidden", display: "" });
                offset = that.wrapper.offset();
                that.wrapper.css({ top: offset.top, left: offset.left })
                            .css({ visibility: "visible", display: "none" });
            }

            that.wrapper
                .toggleClass("t-rtl", that.wrapper.closest(".t-rtl").length > 0)
                .appendTo(document.body);
        }

        if (that.options.modal) {
            that.overlay(that.wrapper.is(":visible")).css({ opacity: 0.5 });
        }

        var windowActions = ".t-window-titlebar .t-window-action";

        that.wrapper
            .delegate(windowActions, "mouseenter", function () { $(this).addClass('t-state-hover'); })
            .delegate(windowActions, "mouseleave", function () { $(this).removeClass('t-state-hover'); })
            .delegate(windowActions, "click", $.proxy(this.windowActionHandler, that));

        if (that.options.resizable) {
            that.wrapper
                .delegate(".t-window-titlebar", "dblclick", $.proxy(this.toggleMaximization, that))
                .append(Window.getResizeHandlesHtml());

            fixIE6Sizing(that.wrapper);

            (function(wnd) {
                function dragstart(e) {
                    var wrapper = wnd.wrapper;
                    wnd.elementPadding = parseInt(wnd.wrapper.css("padding-top"));
                    wnd.initialCursorPosition = wrapper.offset();

                    wnd.resizeDirection = e.currentTarget.prop("className").replace("t-resize-handle t-resize-", "").split("");

                    wnd.initialSize = {
                        width: wnd.wrapper.width(),
                        height: wnd.wrapper.height()
                    };

                    $("<div class='t-overlay' />").appendTo(wnd.wrapper);

                    wrapper.find(".t-resize-handle").not(e.currentTarget).hide();

                    $(document.body).css("cursor", e.currentTarget.css("cursor"));
                }

                function drag(e) {
                    var wrapper = wnd.wrapper;

                    var resizeHandlers = {
                        "e": function () {
                            var width = e.pageX - wnd.initialCursorPosition.left;
                            wrapper.width((width < wnd.options.minWidth
                                                 ? wnd.options.minWidth
                                                 : (wnd.options.maxWidth && width > wnd.options.maxWidth)
                                                 ? wnd.options.maxWidth
                                                 : width));
                        },
                        "s": function () {
                            var height = e.pageY - wnd.initialCursorPosition.top - wnd.elementPadding;
                            wnd.wrapper
                               .height((height < wnd.options.minHeight ? wnd.options.minHeight
                                       : (wnd.options.maxHeight && height > wnd.options.maxHeight) ? wnd.options.maxHeight
                                       : height));
                        },
                        "w": function () {
                            var windowRight = wnd.initialCursorPosition.left + wnd.initialSize.width;
                            wrapper.css("left", e.pageX > (windowRight - wnd.options.minWidth) ? windowRight - wnd.options.minWidth
                                              : e.pageX < (windowRight - wnd.options.maxWidth) ? windowRight - wnd.options.maxWidth
                                              : e.pageX);

                            var width = windowRight - e.pageX;
                            wrapper.width((width < wnd.options.minWidth ? wnd.options.minWidth
                                                 : (wnd.options.maxWidth && width > wnd.options.maxWidth) ? wnd.options.maxWidth
                                                 : width));

                        },
                        "n": function () {
                            var windowBottom = wnd.initialCursorPosition.top + wnd.initialSize.height;

                            wrapper.css("top", e.pageY > (windowBottom - wnd.options.minHeight) ? windowBottom - wnd.options.minHeight
                                             : e.pageY < (windowBottom - wnd.options.maxHeight) ? windowBottom - wnd.options.maxHeight
                                             : e.pageY);

                            var height = windowBottom - e.pageY;
                            wrapper
                               .height((height < wnd.options.minHeight ? wnd.options.minHeight
                                       : (wnd.options.maxHeight && height > wnd.options.maxHeight) ? wnd.options.maxHeight
                                       : height));
                        }
                    };

                    $.each(wnd.resizeDirection, function () {
                        resizeHandlers[this]();
                    });

                    fixIE6Sizing(wrapper);

                    wnd.trigger(RESIZE);
                }

                function dragend(e) {
                    var wrapper = wnd.wrapper;
                    wrapper
                        .find(".t-overlay").remove().end()
                        .find(".t-resize-handle").not(e.currentTarget).show();

                    $(document.body).css("cursor", "");

                    if (e.keyCode == 27) {
                        fixIE6Sizing(wrapper);
                        wrapper.css(wnd.initialCursorPosition)
                               .css(wnd.initialSize);
                    }

                    return false;
                }

                new Draggable(wnd.wrapper, {
                    filter: ".t-resize-handle",
                    group: wnd.wrapper.id + "-resizing",
                    dragstart: dragstart,
                    drag: drag,
                    dragend: dragend
                });
            })(that);
        }

        if (this.options.draggable) {
            (function(wnd){
                function dragstart(e) {
                    wnd.initialWindowPosition = wnd.wrapper.position();

                    wnd.startPosition = {
                        left: e.pageX - wnd.initialWindowPosition.left,
                        top: e.pageY - wnd.initialWindowPosition.top
                    };

                    $(".t-resize-handle", wnd.wrapper).hide();

                    $("<div class='t-overlay' />").appendTo(wnd.wrapper);

                    $(document.body).css("cursor", e.currentTarget.css("cursor"));
                }

                function drag(e) {
                    var coordinates = {
                        left: e.pageX - wnd.startPosition.left,
                        top: Math.max(e.pageY - wnd.startPosition.top, 0)
                    };

                    $(wnd.wrapper).css(coordinates);
                }

                function dragend(e) {
                    wnd.wrapper.find(".t-resize-handle")
                               .show()
                               .end()
                               .find(".t-overlay")
                               .remove();

                    $(document.body).css("cursor", "");

                    if (e.keyCode == 27) {
                        e.currentTarget.closest(".t-window").css(wnd.initialWindowPosition);
                    }

                    return false;
                }

                new Draggable(wnd.wrapper, {
                    filter: ".t-window-titlebar",
                    group: wnd.wrapper.id + "-moving",
                    dragstart: dragstart,
                    drag: drag,
                    dragend: dragend
                })
            })(that);
        }

        that.bind([OPEN, ACTIVATE, CLOSE, REFRESH, RESIZE, ERROR, LOAD, MOVE], options);

        $(window).resize($.proxy(this.onDocumentResize, this));

        if (isLocalUrl(this.contentUrl)) {
            this.ajaxRequest();
        }

        if (that.wrapper.is(":visible")) {
            that.trigger(OPEN);
            that.trigger(ACTIVATE);
        }
    };

    $.extend(Window.prototype, {
        options: {
            animation: {
                openAnimation: {
                    effects: { zoomIn: {}, fadeIn: {} },
                    duration: 350,
                    show: true
                },
                closeAnimation: {
                    effects: { zoomOut: { properties: { scale: 0.7 } }, fadeOut: {} },
                    duration: 350,
                    hide: true
                }
            },
            modal: false,
            resizable: true,
            draggable: true,
            minWidth: 50,
            minHeight: 50,
            visible: true
        },

        overlay: function (visible) {
            var overlay = $("body > .t-overlay"),
                doc = $(document);

            if (overlay.length == 0) {
                overlay = $("<div class='t-overlay' />")
                    .toggle(visible)
                    .appendTo(this.wrapper[0].ownerDocument.body);
            } else {
                overlay.toggle(visible);
            }

            if ($.browser.msie && $.browser.version < 7) {
                overlay.css({
                    width: doc.width() - 21,
                    height: doc.height(),
                    position: "absolute"
                });
            }

            return overlay;
        },

        windowActionHandler: function (e) {
            var target = $(e.target).closest(".t-window-action").find(".t-icon"),
                that = this;

            $.each({
                "t-close": that.close,
                "t-maximize": that.maximize,
                "t-restore": that.restore,
                "t-refresh": that.refresh
            }, function (commandName, handler) {
                if (target.hasClass(commandName)) {
                    e.preventDefault();
                    handler.call(that);
                    return false;
                }
            });
        },

        center: function () {
            var wrapper = this.wrapper,
                documentWindow = $(window);

            wrapper.css({
                left: documentWindow.scrollLeft() + Math.max(0, (documentWindow.width() - wrapper.width()) / 2),
                top: documentWindow.scrollTop() + Math.max(0, (documentWindow.height() - wrapper.height()) / 2)
            });

            return this;
        },

        title: function (text) {
            var title = $(".t-window-titlebar > .t-window-title", this.wrapper);

            if (!text) {
                return title.text();
            }

            title.text(text);
            return this;
        },

        content: function (html) {
            var content = $("> .t-window-content", this.wrapper);

            if (!html) {
                return content.html();
            }

            content.html(html);
            return this;
        },

        open: function (e) {
            var that = this,
                wrapper = that.wrapper,
                showOptions = that.options.animation.openAnimation;

            if (!that.trigger(OPEN)) {
                if (that.options.modal) {
                    var overlay = that.overlay(false);

                    if (showOptions.duration) {
                        overlay.kendoStop().kendoAnimate({
                            effects: { fadeOut: { properties: { opacity: 0.5 } } },
                            duration: showOptions.duration,
                            show: true
                        });
                    } else {
                        overlay.css("opacity", 0.5).show();
                    }
                }

                if (!wrapper.is(":visible")) {
                    wrapper.kendoStop().kendoAnimate({
                        effects: showOptions.effects,
                        duration: showOptions.duration,
                        show: showOptions.show,
                        complete: function() {
                            that.trigger(ACTIVATE);
                        }
                    });
                }
            }

            if (that.options.isMaximized) {
               $("html, body").css("overflow", "hidden");
            }

            return that;
        },

        close: function () {
            var that = this,
                wrapper = that.wrapper,
                options = that.options,
                hideOptions = options.animation.closeAnimation;

            if (wrapper.is(":visible")) {
                if (!that.trigger(CLOSE)) {
                    var openedModalWindows = $(".t-window").filter(function() {
                        var window = $(this);
                        return window.is(":visible") && options.modal;
                    });

                    var shouldHideOverlay = options.modal && openedModalWindows.length == 1;

                    var overlay = options.modal ? that.overlay(true) : $(undefined);

                    if (shouldHideOverlay) {
                        if (hideOptions.duration) {
                            overlay.kendoStop().kendoAnimate({
                                 effects: { fadeOut: { properties: { opacity: 0 } } },
                                 duration: hideOptions.duration,
                                 hide: true
                             });
                        } else {
                            overlay.hide();
                        }
                    }

                    wrapper.kendoStop().kendoAnimate({
                        effects: hideOptions.effects,
                        duration: hideOptions.duration,
                        hide: hideOptions.hide,
                        complete: function() {
                            if (shouldHideOverlay) {
                                overlay.hide();
                            }
                        }
                    });
                }
            }

            if (that.options.isMaximized) {
                $("html, body").css("overflow", "");
            }

            return that;
        },

        toggleMaximization: function (e) {
            if (e && $(e.target).closest(".t-window-action").length > 0) {
                return;
            }

            this[this.options.isMaximized ? "restore" : "maximize"]();
        },

        restore: function () {
            var that = this;

            if (!that.options.isMaximized) {
                return;
            }

            that.wrapper
                .css({
                    position: "absolute",
                    left: that.restorationSettings.left,
                    top: that.restorationSettings.top,
                    width: that.restorationSettings.width,
                    height: that.restorationSettings.height
                })
                .find(".t-resize-handle").show().end()
                .find(".t-window-titlebar .t-restore").addClass("t-maximize").removeClass("t-restore");

            $("html, body").css("overflow", "");

            that.options.isMaximized = false;

            that.trigger(RESIZE);

            return that;
        },

        maximize: function (e) {
            var that = this;

            if (that.options.isMaximized) {
                return;
            }

            var wrapper = that.wrapper;

            that.restorationSettings = {
                left: wrapper.position().left,
                top: wrapper.position().top,
                width: wrapper.width(),
                height: wrapper.height()
            };

            wrapper
                .css({ left: 0, top: 0, position: "fixed" })
                .find(".t-resize-handle").hide().end()
                .find(".t-window-titlebar .t-maximize").addClass("t-restore").removeClass("t-maximize");

            $("html, body").css("overflow", "hidden");

            that.options.isMaximized = true;

            that.onDocumentResize();

            return that;
        },

        onDocumentResize: function () {
            if (!this.options.isMaximized) {
                return;
            }

            var wrapper = this.wrapper;

            wrapper
                .css({
                    width: $(window).width(),
                    height: $(window).height()
                });

            fixIE6Sizing(wrapper);

            this.trigger(RESIZE);
        },

        refresh: function () {
            if (isLocalUrl(this.options.contentUrl)) {
                this.ajaxRequest();
            }

            return this;
        },

        ajaxRequest: function (url) {
            var loadingIconTimeout = setTimeout(function () {
                $(".t-refresh", this.wrapper).addClass("t-loading");
            }, 100);

            var data = {};

            $.ajax({
                type: "GET",
                url: url || this.options.contentUrl,
                dataType: "html",
                data: data,
                cache: false,
                error: $.proxy(function (xhr, status) {
                    //fix
                    if ($t.ajaxError(this.wrapper, "error", xhr, status))
                        return;
                }, this),
                complete: function () {
                    clearTimeout(loadingIconTimeout);
                    $(".t-refresh", this.wrapper).removeClass("t-loading");
                },
                success: $.proxy(function (data, textStatus) {
                    $(".t-window-content", this.wrapper).html(data);

                    this.trigger(REFRESH);
                }, this)
            });
        },

        destroy: function () {
            var that = this;

            that.wrapper.remove();

            var openedModalWindows = $(".t-window")
                .filter(function() {
                    var window = $(this);
                    return window.is(":visible") && that.options.modal;
                });

            var shouldHideOverlay = that.options.modal && openedModalWindows.length == 0;

            if (shouldHideOverlay) {
                that.overlay(false).remove();
            }
        }
    });

    // client-side rendering
    $.extend(Window, {
        create: function () {
            var element, options;

            if ($.isPlainObject(arguments[0])) {
                options = arguments[0];
            } else {
                element = arguments[0];
                options = $.extend({
                    html: element.innerHTML
                }, arguments[1]);
            }

            options = $.extend({
                title: "",
                html: "",
                actions: ["Close"]
            }, options);

            var windowHtml = "",
                titleHtml = ""
                contentHtml = "";

            windowHtml += "<div class='t-widget t-window'></div>";

            titleHtml += "<div class='t-window-titlebar t-header'>&nbsp;<span class='t-window-title'>" +
                          options.title + "</span><div class='t-window-actions t-header'>";

            $.map(options.actions, function (command) {
                titleHtml += "<a href='#' class='t-window-action t-link'><span class='t-icon t-" +
                              command.toLowerCase() + "'>" + command + "</span></a>";
            });

            titleHtml += "</div>";

            if (!element) {
                contentHtml = $("<div class='t-window-content t-content'></div>");
            } else {
                contentHtml = $(element);
            }

            if (typeof (options.scrollable) != "undefined" && options.scrollable === false) {
                contentHtml.attr("style", "overflow:hidden;");
            }

            if (options.contentUrl && !isLocalUrl(options.contentUrl)) {
                contentHtml.html("<iframe src='" + options.contentUrl + "' title='" + options.title +
                              "' frameborder='0' style='border:0;width:100%;height:100%;'>This page requires frames in order to show content</iframe>");
            }

            if (element) {
                $(windowHtml).append(titleHtml).append(contentHtml).appendTo(document.body);
            } else {
                windowHtml += "</div>";
                return $(windowHtml).appendTo(document.body).kendoWindow(options);
            }
        },

        getResizeHandlesHtml: function () {
            var html = "";

            $.each("n e s w se sw ne nw".split(" "), function (i, item) {
                html += "<div class='t-resize-handle t-resize-" + item + "'></div>";
            });

            return html;
        }
    });

    kendo.ui.plugin("Window", Window, Component);

})(jQuery, window);
