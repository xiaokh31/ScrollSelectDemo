import { _decorator, Component, Node, Prefab, instantiate } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export default class NewClass extends Component {

    @property(Node)
    content: Node = null;

    @property(Prefab)
    horizontalP: Prefab = null;

    @property(Prefab)
    verticalP: Prefab = null;

    @property(Node)
    contact: Node = null;

    start() {
        this.contact.active = true;
    }

    //切换到水平模式的scrollSelect
    onClickGotoHorizontal() {
        this.contact.active = false;
        this._clearConten();
        let hp = instantiate(this.horizontalP);
        this.content.addChild(hp);
        hp.setPosition(0, 0);
    }

    //切换到垂直模式的scrollSelect
    onClickGotoVertical() {
        this.contact.active = false;
        this._clearConten();
        let vp = instantiate(this.verticalP);
        this.content.addChild(vp);
        vp.setPosition(0, 0);
    }

    //返回主页面
    onClickBack() {
        this._clearConten();
        this.contact.active = true;
    }

    _clearConten() {
        this.content.removeAllChildren();
    }
}
