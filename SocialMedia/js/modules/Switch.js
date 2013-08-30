define([
	"dojo/_base/array",
	"dojo/_base/connect",
	"dojo/_base/declare",
	"dojo/_base/event",
	"dojo/_base/window",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/touch",
	"dijit/_Contained",
	"dijit/_WidgetBase",
    "dojox/mobile/Switch",
	"./sniff"
], function (array, connect, declare, event, win, domClass, domConstruct, domStyle, touch, Contained, WidgetBase, Switch, has) {
    var Widget = declare("modules.Switch", [WidgetBase, Contained, Switch], {
        buildRendering: function () {
            dojo.mixin(this, Switch);
            this.inherited(arguments);
        },
        //override ontouchstart
        onTouchStart: function (/*Event*/e) {
            // summary:
            //		Internal function to handle touchStart events.
            this._moved = false;
            this.innerStartX = this.inner.offsetLeft;
            if (!this._conn) {
                this._conn = [
					this.connect(this.inner, touch.move, "onTouchMove"),
					this.connect(win.doc, touch.release, "onTouchEnd")
				];
            }
            this.touchStartX = e.touches ? e.touches[0].pageX : e.clientX;
            this.left.style.display = "";
            this.right.style.display = "";
            event.stop(e);
            this._createMaskImage();
        },

        //override ontouch end
        onTouchEnd: function (/*Event*/e) {
            // summary:
            //		Internal function to handle touchEnd events.
            array.forEach(this._conn, connect.disconnect);
            this._conn = null;
            if (this.innerStartX == this.inner.offsetLeft) {
                if (has('touch')) {
                    var ev = win.doc.createEvent("MouseEvents");
                    ev.initEvent("click", true, true);
                    this.inner.dispatchEvent(ev);
                }
                return;
            }
            var newState = (this.inner.offsetLeft < -(this._width / 2)) ? "off" : "on";
            this._changeState(newState, true);
            if (newState != this.value) {
                this.value = this.input.value = newState;
                this.onStateChanged(newState);
            }
        }
    });
    return Widget;
});
