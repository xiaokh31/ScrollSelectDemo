import { _decorator, Component, Node, CCInteger, CCFloat, Label, EventHandler, instantiate, error, UITransform } from "cc";
const { ccclass, property } = _decorator;

export enum EventType {
    SCROLL_START,
    SCROLL_ING,
    SCROLL_END,
}

@ccclass('UIScrollSelectVertical')
export class UIScrollSelectVertical extends Component {
    public static EventType = EventType;
    @property({
        type: CCInteger,
        tooltip: "开始数值",
    })
    startValue: number = 0;
    @property({
        type: CCInteger,
        tooltip: "截止数值",
    })
    endValue: number = 0;
    @property({
        type: CCInteger,
        tooltip: "最后数值",
    })
    lastValue: number = 0;
    @property(Node)
    content: Node = null;
    @property(Node)
    item: Node = null;
    @property({
        type: CCInteger,
        tooltip: "单个控件之间的距离",
    })
    deltaY: number = 100; //y间隔距离
    @property({
        type: CCFloat,
        tooltip: "中心点的缩放比例",
    })
    centerScale: number = 1.0;
    @property({
        type: CCFloat,
        tooltip: "边缘点的缩放比例",
    })
    minScale: number = 1.0;
    @property({
        type: CCFloat,
        tooltip: "滚动时的速度",
    })
    scrollSpeed: number = 300;
    @property({
        type: EventHandler,
        tooltip: "选择后的回调",
    })
    selectEvents: Array<EventHandler> = [];

    private childs: Array<Node> = [];
    private isTouching: boolean = false;
    private hasTouchMove: boolean = false;
    private isTestY: boolean = false;
    private _touchId: any = null;
    private currentIndex: number = 0;
    private _toMoveY: number = 1; //移动方向
    private dy: number = 0;
    private moveAim: number = 0;

    onLoad() {
        this.childs = [];
        for (var i = this.startValue; i <= this.endValue; i++) {
            let item = instantiate(this.item);
            item.setParent(this.content);
            item.name = i.toString();
            if (this.lastValue >= i) {
                item.getComponent(Label).string = i.toString() //+ "f"
            } else {
                item.getComponent(Label).string = "wx";
            }
            item.setPosition(0, this.deltaY * (i - 1));
            item.active = true;
            this.childs[i] = item;
        }
        this.isTouching = false;
        this.hasTouchMove = false;
        this.isTestY = false;
        this._touchId = null;
        this.scrollTo(0, false);
    }
    /** 滚动到指定节点
     * @param anim 是否带移动动画
     */
    scrollTo(idy: number, anim: boolean = true) {
        if (idy < 0 && idy >= this.childs.length) {
            return error(this.node.name + "->移动超出边界面");
        }
        this.currentIndex = idy;
        this.moveAim = idy;
        if (!anim) {
            for (var i = 0; i < this.childs.length; i++) {
                this._checkChildY(this.childs[i], (i - idy) * this.deltaY);
            }
        } else {
            this.isTestY = true;
            Component.EventHandler.emitEvents(this.selectEvents, {
                target: this,
                type: EventType.SCROLL_START,
                index: this.currentIndex,
            });
        }
    }
    /** 向上滚一个点 */
    scrollToTop() {
        this._toMoveY = 1;
        this.scrollTo((this.currentIndex - 1 + this.childs.length) % this.childs.length);
    }

    /** 向下滚一个点 */
    scrollToBottom() {
        this._toMoveY = -1;
        this.scrollTo((this.currentIndex + 1 + this.childs.length) % this.childs.length);
    }

    _checkChildY(child, y) {
        if (y > (this.childs.length / 2) * this.deltaY) {
            y -= this.childs.length * this.deltaY;
        } else if (y < (-this.childs.length / 2) * this.deltaY) {
            y += this.childs.length * this.deltaY;
        }
        child.setPosition(child.position.x, y);
        let dy = Math.min(Math.abs(y), this.deltaY);
        let scaleY = (1 - dy / this.deltaY) * (this.centerScale - this.minScale) + this.minScale;
        child.setScale(child.scale.x, scaleY);
    }

    start() {
        this.content.on(Node.EventType.TOUCH_START, this._onTouch, this);
        this.content.on(Node.EventType.TOUCH_MOVE, this._onTouch, this);
        this.content.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.content.on(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }
    _onTouch(event) {
        if (this._touchId != null && event.touch != this._touchId) {
            return;
        }
        if (event.type == Node.EventType.TOUCH_START) {
            this.isTouching = true;
            this.hasTouchMove = false;
            this.isTestY = false;
            this._touchId = event.touch;
            this.dy = event.getStartLocation().y;
            let evt = {
                target: this,
                type: EventType.SCROLL_START,
                index: this.currentIndex,
            };
            Component.EventHandler.emitEvents(this.selectEvents, evt);
            return;
        }
        this.hasTouchMove = true;
        var dy = event.getLocation().y - this.dy;
        this._move(dy);
        this.dy = event.getLocation().y;
        var evt = {
            target: this,
            type: EventType.SCROLL_ING,
            dy: this.dy,
        };
        Component.EventHandler.emitEvents(this.selectEvents, evt);
    }
    _onTouchEnd(event) {
        if (this._touchId != null && event.touch != this._touchId) {
            return;
        }
        this.isTouching = false;
        if (event.type == Node.EventType.TOUCH_END || event.type == Node.EventType.TOUCH_CANCEL) {
            this._touchId = null;
        }
        let lo = this.node.getComponent(UITransform).convertToNodeSpaceAR(event.getLocation());
        if (!this.hasTouchMove) {
            let my = Math.ceil((lo.y - this.deltaY / 2) / this.deltaY);
            if (my === 0) {//点击,不move，才走这里
                var event1 = {
                    target: this,
                    type: EventType.SCROLL_END,
                    index: this.currentIndex,
                };
                Component.EventHandler.emitEvents(this.selectEvents, event1);
            } else {
                this.moveAim = (this.currentIndex + my + this.childs.length) % this.childs.length;
                this._toMoveY = my > 0 ? -1 : 1;
                this.isTestY = true;
            }
            return;
        }
        let max = this.deltaY;
        let minidy = 0;
        for (let i = 0; i < this.childs.length; i++) {
            if (Math.abs(this.childs[i].position.y) <= max) {
                max = Math.abs(this.childs[i].position.y);
                minidy = i;
            }
        }
        this.moveAim = minidy;
        this._toMoveY = this.childs[minidy].position.y >= 0 ? -1 : 1;
        this.isTestY = true;
    }
    _move(dt) {
        for (var i = 0; i < this.childs.length; i++) {
            this._checkChildY(this.childs[i], this.childs[i].position.y + dt);
        }
    }

    update(dt) {
        if (this.isTouching || !this.isTestY || Number.isNaN(this.moveAim)) {
            return;
        }
        var stepy = this._toMoveY * dt * this.scrollSpeed;
        let ly = this.childs[this.moveAim].position.y;
        for (var i = 0; i < this.childs.length; i++) {
            this._checkChildY(this.childs[i], this.childs[i].position.y + stepy);
        }

        var y = this.childs[0].position.y;
        var idy = Math.round(y / this.deltaY);
        var toy = this.deltaY * idy;
        let cy = this.childs[this.moveAim].position.y;
        if (ly * cy < 0 && Math.abs(cy) < this.deltaY) {
            this.isTestY = false;
            for (let i = 0; i < this.childs.length; i++) {
                if (Math.abs(this.childs[i].position.y) <= Math.abs(stepy)) {
                    this.currentIndex = i;
                    break;
                }
            }
            for (var i = 0; i < this.childs.length; i++) {
                this._checkChildY(this.childs[i], this.childs[i].position.y + toy - y);
            }
            var event = {
                target: this,
                type: EventType.SCROLL_END,
                index: this.currentIndex,
            };
            Component.EventHandler.emitEvents(this.selectEvents, event);
        }
    }

    getCurrentIndex() {
        return this.currentIndex;
    }
}
