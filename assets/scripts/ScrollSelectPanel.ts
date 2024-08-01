import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

import { UIScrollSelectVertical } from './UIScrollSelectVertical';

@ccclass('ScrollSelectPanel')
export class ScrollSelectPanel extends Component {
    @property(Node)
    startNode: Node = null;
    @property(Node)
    endNode: Node = null;

    @property({
        type: Label,
        tooltip: "提示",
    })
    tips: Label = null;

    private _startScore: number = 0;
    private _endScore: number = 0;

    onLoad() {
        this._startScore = this.startNode.getComponent(UIScrollSelectVertical).getCurrentIndex();
        this._endScore = this.endNode.getComponent(UIScrollSelectVertical).getCurrentIndex();

        this.tips.string = "";
    }

    onEventStartScrollSelect(event, customEventData) {
        if (event.type === 2) {
            this._startScore = event.index;
        }
    }

    onEventEndScrollSelect(event, customEventData) {
        if (event.type === 2) {
            this._endScore = event.index;
        }
    }

    onClickOK() {
        if (this._startScore > this._endScore) {
            this.tips.string = "起始值大于最大值!";
            return;
        }
        this.tips.string = "起始值：" + this._startScore + "\n最大值：" + this._endScore;
    }

    onClickReset() {
        this.tips.string = "";
        this.startNode.getComponent(UIScrollSelectVertical).scrollTo(0, false);
        this.endNode.getComponent(UIScrollSelectVertical).scrollTo(0, false);
    }
}
